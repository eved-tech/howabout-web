"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/server";
import { similarity, DUPLICATE_THRESHOLD } from "@/lib/dedupe";
import { slugify } from "@/lib/slug";
import { isFlaggable, FLAGGED_MESSAGE } from "@/lib/moderation";

const HEADLINE_MAX = 60;
const BODY_MAX = 240;

// Neon Managed Auth owns the account itself; this mirrors the signed-in
// person into our own `User` row (keyed by email) the first time we see
// them, so ideas/votes can carry a normal foreign key.
async function getCurrentUser() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.email) return null;

  return prisma.user.upsert({
    where: { email: session.user.email },
    update: { name: session.user.name ?? undefined },
    create: { email: session.user.email, name: session.user.name },
  });
}

export async function searchBrands(query: string) {
  const q = query.trim();
  if (!q) return [];

  const brands = await prisma.brand.findMany({
    where: { name: { contains: q, mode: "insensitive" }, approved: true },
    include: { _count: { select: { ideas: true } } },
    orderBy: { name: "asc" },
    take: 5,
  });

  return brands.map((b) => ({
    slug: b.slug,
    name: b.name,
    claimed: b.claimed,
    ideaCount: b._count.ideas,
  }));
}

export async function getBrandSummary(slug: string) {
  const brand = await prisma.brand.findUnique({ where: { slug } });
  if (!brand || !brand.approved) return null;

  const ideas = await prisma.idea.findMany({
    where: { brandId: brand.id },
    include: { _count: { select: { votes: true } } },
  });

  const ideaCount = ideas.length;
  const voteCount = ideas.reduce((sum, idea) => sum + idea._count.votes, 0);
  const respondedCount = ideas.filter((idea) => idea.response !== null).length;
  const responseRate = ideaCount === 0 ? null : Math.round((respondedCount / ideaCount) * 100);

  return {
    slug: brand.slug,
    name: brand.name,
    description: brand.description,
    claimed: brand.claimed,
    ideaCount,
    voteCount,
    responseRate,
  };
}

async function findSimilarIdea(brandId: string, headline: string, body: string) {
  const existing = await prisma.idea.findMany({
    where: { brandId },
    include: { _count: { select: { votes: true } } },
  });

  const text = `${headline} ${body}`;
  let best: { id: string; headline: string; votes: number; score: number } | null = null;
  for (const idea of existing) {
    const score = similarity(text, `${idea.headline} ${idea.body}`);
    if (score >= DUPLICATE_THRESHOLD && (!best || score > best.score)) {
      best = { id: idea.id, headline: idea.headline, votes: idea._count.votes, score };
    }
  }
  return best;
}

export async function checkSimilarIdea(brandSlug: string, headline: string, body: string) {
  if (!headline.trim() && !body.trim()) return null;

  const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
  if (!brand || !brand.approved) return null;

  return findSimilarIdea(brand.id, headline, body);
}

// Used by the home page's idea feed, where "Cheer on" toggles a vote on and
// off (unlike the brand page's one-way upvote above).
export async function toggleCheer(ideaId: string) {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: { brand: { select: { approved: true } } },
  });
  if (!idea || !idea.brand.approved) return;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/sign-in?redirectTo=${encodeURIComponent("/")}`);
  }

  const existing = await prisma.vote.findUnique({
    where: { ideaId_userId: { ideaId, userId: user.id } },
  });

  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } });
  } else {
    await prisma.vote.create({ data: { ideaId, userId: user.id } });
  }

  revalidatePath("/");
}

export async function voteIdea(ideaId: string, brandSlug: string) {
  const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
  if (!brand || !brand.approved) return;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/sign-in?redirectTo=${encodeURIComponent(`/brands/${brandSlug}`)}`);
  }

  await prisma.vote.upsert({
    where: { ideaId_userId: { ideaId, userId: user.id } },
    update: {},
    create: { ideaId, userId: user.id },
  });

  revalidatePath(`/brands/${brandSlug}`);
}

type CreateIdeaResult =
  | { status: "duplicate"; match: { id: string; headline: string; votes: number } }
  | { status: "created"; ideaId: string }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

export async function createIdea(input: {
  brandSlug: string;
  headline: string;
  body: string;
  category?: string;
  force?: boolean;
}): Promise<CreateIdeaResult> {
  const headline = input.headline.trim();
  const body = input.body.trim();
  if (!headline || !body) {
    return { status: "error", message: "Enter a headline and a bit more detail." };
  }
  if (headline.length > HEADLINE_MAX || body.length > BODY_MAX) {
    return { status: "error", message: "Keep it brief — you're over the character limit." };
  }

  const brand = await prisma.brand.findUnique({ where: { slug: input.brandSlug } });
  if (!brand || !brand.approved) {
    return { status: "error", message: "Unknown brand." };
  }

  if (isFlaggable(headline, body)) {
    return { status: "error", message: FLAGGED_MESSAGE };
  }

  if (!input.force) {
    const best = await findSimilarIdea(brand.id, headline, body);
    if (best) {
      return { status: "duplicate", match: best };
    }
  }

  const user = await getCurrentUser();
  if (!user) {
    return { status: "unauthenticated" };
  }

  const idea = await prisma.idea.create({
    data: {
      headline,
      body,
      category: input.category,
      brandId: brand.id,
      authorId: user.id,
      source: "WEB",
    },
  });

  revalidatePath(`/brands/${input.brandSlug}`);
  revalidatePath("/");
  return { status: "created", ideaId: idea.id };
}

type CreateBrandAndIdeaResult =
  | { status: "pending_brand"; brandName: string }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

// A brand nobody's submitted to yet. Created unapproved — it and its idea
// stay invisible to everyone (search, listings, direct URL) until a human
// approves it. No dedupe check: there's nothing to dedupe against yet.
export async function createBrandAndIdea(input: {
  name: string;
  headline: string;
  body: string;
  category?: string;
}): Promise<CreateBrandAndIdeaResult> {
  const name = input.name.trim();
  const headline = input.headline.trim();
  const body = input.body.trim();
  if (!name) {
    return { status: "error", message: "Enter the business or brand name first." };
  }
  if (!headline || !body) {
    return { status: "error", message: "Enter a headline and a bit more detail." };
  }
  if (headline.length > HEADLINE_MAX || body.length > BODY_MAX) {
    return { status: "error", message: "Keep it brief — you're over the character limit." };
  }
  if (isFlaggable(headline, body)) {
    return { status: "error", message: FLAGGED_MESSAGE };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { status: "unauthenticated" };
  }

  const baseSlug = slugify(name) || "brand";
  let slug = baseSlug;
  for (let suffix = 2; await prisma.brand.findUnique({ where: { slug } }); suffix++) {
    slug = `${baseSlug}-${suffix}`;
  }

  const brand = await prisma.brand.create({
    data: { name, slug, approved: false },
  });

  await prisma.idea.create({
    data: {
      headline,
      body,
      category: input.category,
      brandId: brand.id,
      authorId: user.id,
      source: "WEB",
    },
  });

  return { status: "pending_brand", brandName: brand.name };
}

export async function respondToIdea(input: {
  ideaId: string;
  brandSlug: string;
  response: string;
  status: "PLANNED" | "RESPONDED" | "DECLINED";
}) {
  const user = await getCurrentUser();
  if (!user) return;

  const idea = await prisma.idea.findUnique({
    where: { id: input.ideaId },
    select: { brandId: true },
  });
  if (!idea) return;

  const owner = await prisma.brandOwner.findUnique({
    where: { brandId_userId: { brandId: idea.brandId, userId: user.id } },
  });
  if (!owner) return;

  await prisma.idea.update({
    where: { id: input.ideaId },
    data: {
      response: input.response,
      status: input.status,
      respondedAt: new Date(),
    },
  });

  revalidatePath(`/dashboard/${input.brandSlug}`);
  revalidatePath(`/brands/${input.brandSlug}`);
}

export async function isBrandOwner(brandSlug: string) {
  const user = await getCurrentUser();
  if (!user) return false;

  const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
  if (!brand) return false;

  const owner = await prisma.brandOwner.findUnique({
    where: { brandId_userId: { brandId: brand.id, userId: user.id } },
  });
  return !!owner;
}

async function requireAdmin() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    throw new Error("Not authorized.");
  }
}

export async function listBrandsForAdmin() {
  await requireAdmin();
  return prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { owners: { include: { user: true } } },
  });
}

export async function grantBrandOwnership(brandSlug: string, email: string) {
  await requireAdmin();

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { status: "error", message: "Enter an email first." } as const;

  const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
  if (!brand) return { status: "error", message: "Unknown brand." } as const;

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {},
    create: { email: normalizedEmail },
  });

  await prisma.brandOwner.upsert({
    where: { brandId_userId: { brandId: brand.id, userId: user.id } },
    update: {},
    create: { brandId: brand.id, userId: user.id },
  });

  if (!brand.claimed) {
    await prisma.brand.update({ where: { id: brand.id }, data: { claimed: true } });
  }

  revalidatePath("/admin");
  return { status: "ok" } as const;
}

// Anyone can report a live idea as a complaint — but only while it's still
// unmoderated. Once a human has ruled on it (either way), the report option
// disappears for everyone; we've already made the call.
export async function reportIdea(ideaId: string) {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: { moderationStatus: true, reportedAt: true, brand: { select: { slug: true } } },
  });
  if (!idea || idea.moderationStatus !== null || idea.reportedAt) return;

  await prisma.idea.update({ where: { id: ideaId }, data: { reportedAt: new Date() } });

  revalidatePath("/");
  revalidatePath(`/brands/${idea.brand.slug}`);
}

export async function listModerationQueue() {
  await requireAdmin();
  return prisma.idea.findMany({
    where: { moderationStatus: null },
    orderBy: [{ reportedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    include: { brand: { select: { name: true, slug: true } } },
  });
}

// A COMPLAINT ruling hides the idea from public view (not deleted); CLEAR
// just removes the report option. Either way the ruling is final.
export async function moderateIdea(ideaId: string, status: "CLEAR" | "COMPLAINT") {
  await requireAdmin();

  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: { brand: { select: { slug: true } } },
  });
  if (!idea) return;

  await prisma.idea.update({ where: { id: ideaId }, data: { moderationStatus: status } });

  revalidatePath("/");
  revalidatePath(`/brands/${idea.brand.slug}`);
  revalidatePath("/admin/moderation");
}
