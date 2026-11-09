"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { similarity, DUPLICATE_THRESHOLD } from "@/lib/dedupe";

// No auth system yet (see README) — every action runs as one demo user
// until real accounts (web) / phone-number identity (WhatsApp) land.
async function getOrCreateDemoUser() {
  return prisma.user.upsert({
    where: { email: "demo@howabout.co.za" },
    update: {},
    create: { email: "demo@howabout.co.za", name: "Demo user" },
  });
}

export async function voteIdea(ideaId: string, brandSlug: string) {
  const user = await getOrCreateDemoUser();

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
    const existing = await prisma.idea.findMany({
      where: { brandId: brand.id },
      include: { _count: { select: { votes: true } } },
    });

    let best: { id: string; text: string; votes: number; score: number } | null = null;
    for (const idea of existing) {
      const score = similarity(text, idea.text);
      if (score >= DUPLICATE_THRESHOLD && (!best || score > best.score)) {
        best = { id: idea.id, text: idea.text, votes: idea._count.votes, score };
      }
    }

    if (best) {
      return { status: "duplicate", match: best };
    }
  }

  const user = await getOrCreateDemoUser();
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
