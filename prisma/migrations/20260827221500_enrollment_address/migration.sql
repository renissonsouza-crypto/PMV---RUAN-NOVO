ALTER TABLE "enrollments"
ADD COLUMN "street" VARCHAR(180),
ADD COLUMN "address_complement" VARCHAR(180),
ADD COLUMN "municipality" VARCHAR(120),
ADD COLUMN "state" VARCHAR(2),
ADD COLUMN "region" VARCHAR(40),
ADD COLUMN "ibge_code" VARCHAR(12),
ADD COLUMN "ddd" VARCHAR(3);
