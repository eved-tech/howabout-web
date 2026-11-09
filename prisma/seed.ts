import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const woolworths = await prisma.brand.upsert({
    where: { slug: "woolworths" },
    update: {},
    create: { slug: "woolworths", name: "Woolworths" },
  });

  const clubMall = await prisma.brand.upsert({
    where: { slug: "club-mall" },
    update: {},
    create: { slug: "club-mall", name: "Club Mall" },
  });

  const plato = await prisma.brand.upsert({
    where: { slug: "plato" },
    update: {},
    create: { slug: "plato", name: "Plato" },
  });

  const voters = await Promise.all(
    ["alice", "bongani", "chen", "dineo", "ethan"].map((name) =>
      prisma.user.upsert({
        where: { email: `${name}@example.com` },
        update: {},
        create: { email: `${name}@example.com`, name },
      })
    )
  );

  const milkIdea = await prisma.idea.upsert({
    where: { id: "seed-milk-idea" },
    update: {},
    create: {
      id: "seed-milk-idea",
      brandId: woolworths.id,
      authorId: voters[0].id,
      text: "Sell fresh milk in 250ml boxes so it doesn't go off before I finish a litre",
      category: "Product",
      status: "RESPONDED",
      response:
        "We're trialling 250ml fresh milk boxes in 12 stores from next month — thanks for the idea!",
      respondedAt: new Date(),
    },
  });

  const checkoutIdea = await prisma.idea.upsert({
    where: { id: "seed-checkout-idea" },
    update: {},
    create: {
      id: "seed-checkout-idea",
      brandId: woolworths.id,
      authorId: voters[1].id,
      text: "Add a self-checkout lane at the Rondebosch store",
      category: "Store experience",
      status: "NEW",
    },
  });

  const loyaltyIdea = await prisma.idea.upsert({
    where: { id: "seed-loyalty-idea" },
    update: {},
    create: {
      id: "seed-loyalty-idea",
      brandId: woolworths.id,
      authorId: voters[2].id,
      text: "Bring back the old loyalty stamp card alongside the app",
      category: "Service",
      status: "PLANNED",
    },
  });

  await prisma.idea.upsert({
    where: { id: "seed-parking-idea" },
    update: {},
    create: {
      id: "seed-parking-idea",
      brandId: clubMall.id,
      authorId: voters[3].id,
      text: "Accept the Admyt app as a parking payment option",
      category: "Service",
      status: "NEW",
    },
  });

  await prisma.idea.upsert({
    where: { id: "seed-pumpkin-idea" },
    update: {},
    create: {
      id: "seed-pumpkin-idea",
      brandId: plato.id,
      authorId: voters[4].id,
      text: "Add a pumpkin spice flavoured coffee for the summer menu",
      category: "Product",
      status: "NEW",
    },
  });

  // A handful of real votes so the feed isn't all zeros.
  const voteOn = async (ideaId: string, userIds: string[]) => {
    for (const userId of userIds) {
      await prisma.vote.upsert({
        where: { ideaId_userId: { ideaId, userId } },
        update: {},
        create: { ideaId, userId },
      });
    }
  };

  await voteOn(milkIdea.id, voters.map((v) => v.id));
  await voteOn(checkoutIdea.id, voters.slice(0, 3).map((v) => v.id));
  await voteOn(loyaltyIdea.id, voters.slice(0, 2).map((v) => v.id));

  console.log("Seeded brands: woolworths, club-mall, plato");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
