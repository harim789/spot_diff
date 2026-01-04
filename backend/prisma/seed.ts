import { Role } from "@prisma/client";
import { prisma } from "../src/prisma";
import bcrypt from "bcrypt";

async function main() {
  // admin 유저 생성 
  const username = "admin";
  const password = "admin1234";
  const passwordHash = await bcrypt.hash(password, 10);

  // upsert : Update + Insert
  // DB 확인 후 admin이라는 사용자가 있으면 update, 없으면 create
  await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      username,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  // 샘플 레벨 1개 생성
  const level = await prisma.level.create({
    data: {
      title: "Sample Level 1",
      leftImageUrl: "https://example.com/left.png",
      rightImageUrl: "https://example.com/right.png",
      isPublished: false,
    },
  });

  // 샘플 diff 1개
  await prisma.diff.create({
    data: {
      levelId: level.id,
      x: 200,
      y: 150,
      r: 30,
    },
  });

  // diffCount 업데이트
  const diffCount = await prisma.diff.count({ where: { levelId: level.id } });
  await prisma.level.update({
    where: { id: level.id },
    data: { diffCount },
  });

  console.log("Seed complete");
  console.log("admin login:", { username: "admin", password: "admin1234" });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });