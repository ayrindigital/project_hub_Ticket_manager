#!/bin/sh
set -eu

echo "Running Prisma migrations..."
pnpm prisma migrate deploy

if [ "${SEED_ON_STARTUP:-true}" = "true" ]; then
  echo "Checking whether seed data is needed..."
  if node -e "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); p.project.count().then((count)=>{console.log(count); process.exit(count===0?10:0);}).catch(()=>process.exit(11)).finally(()=>p.$disconnect());"; then
    echo "Seed data already present. Skipping seed."
  else
    code="$?"
    if [ "$code" = "10" ]; then
      echo "Database is empty. Running seed script..."
      pnpm prisma:seed
    else
      echo "Could not verify seed state (exit $code). Continuing without auto-seed."
    fi
  fi
fi

echo "Starting API..."
node dist/src/main.js
