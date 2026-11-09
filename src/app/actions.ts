"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/server";
import { similarity, DUPLICATE_THRESHOLD } from "@/lib/dedupe";

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
    where: { name: { contains: q, mode: "insensitive" } },
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
  if (!brand) return null;

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

async function findSimilarIdea(brandId: string, text: string) {
  const existing = await prisma.idea.findMany({
    where: { brandId },
    include: { _count: { select: { votes: true } } },
  });

  let best: { id: string; text: string; votes: number; score: number } | null = null;
  for (const idea of existing) {
    const score = similarity(text, idea.text);
    if (score >= DUPLICATE_THRESHOLD && (!best || score > best.score)) {
      best = { id: idea.id, text: idea.text, votes: idea._count.votes, score };
    }
  }
  return best;
}

export async function checkSimilarIdea(brandSlug: string, text: string) {
  if (!text.trim()) return null;

  const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
  if (!brand) return null;

  return findSimilarIdea(brand.id, text);
}

export async function voteIdea(ideaId: string, brandSlug: string) {
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
  | { status: "duplicate"; match: { id: string; text: string; votes: number } }
  | { status: "created"; ideaId: string }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

export async function createIdea(input: {
  brandSlug: string;
  text: string;
  category?: string;
  force?: boolean;
}): Promise<CreateIdeaResult> {
  const text = input.text.trim();
  if (!text) {
    return { status: "error", message: "Enter your idea first." };
  }

  const brand = await prisma.brand.findUnique({ where: { slug: input.brandSlug } });
  if (!brand) {
    return { status: "error", message: "Unknown brand." };
  }

  if (!input.force) {
    const best = await findSimilarIdea(brand.id, text);
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
      text,
      category: input.category,
      brandId: brand.id,
      authorId: user.id,
      source: "WEB",
    },
  });

  revalidatePath(`/brands/${input.brandSlug}`);
  return { status: "created", ideaId: idea.id };
}

// Anyone can still call this — brand-side identity (claiming a brand page)
// isn't built yet, so the dashboard has no access control of its own.
export async function respondToIdea(input: {
  ideaId: string;
  brandSlug: string;
  response: string;
  status: "PLANNED" | "RESPONDED" | "DECLINED";
}) {
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
