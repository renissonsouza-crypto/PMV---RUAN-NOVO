ALTER TABLE "enrollments" ALTER COLUMN "district" DROP NOT NULL;
ALTER TABLE "enrollments"
  ADD COLUMN "eligibility_type" VARCHAR(20),
  ADD COLUMN "cep" VARCHAR(9),
  ADD COLUMN "cnpj" VARCHAR(18),
  ADD COLUMN "race" VARCHAR(20),
  ADD COLUMN "birth_date" DATE,
  ADD COLUMN "gender" VARCHAR(40),
  ADD COLUMN "education" VARCHAR(80),
  ADD COLUMN "disability" TEXT,
  ADD COLUMN "accessibility_needs" TEXT,
  ADD COLUMN "companion_needs" TEXT,
  ADD COLUMN "rg_document_path" TEXT,
  ADD COLUMN "lgpd_accepted_at" TIMESTAMP(3),
  ADD COLUMN "commitment_accepted_at" TIMESTAMP(3),
  ADD COLUMN "terms_version" VARCHAR(30);

CREATE INDEX "enrollments_cpf_created_at_idx" ON "enrollments"("cpf", "created_at");
