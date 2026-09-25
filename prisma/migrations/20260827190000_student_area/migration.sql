CREATE TABLE "curriculum_modules" (
  "id" UUID NOT NULL,
  "course_id" UUID NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "description" TEXT NOT NULL,
  "workload" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "curriculum_modules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "class_sessions" (
  "id" UUID NOT NULL,
  "class_id" UUID NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "location" VARCHAR(180),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "class_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "certificates" (
  "id" UUID NOT NULL,
  "enrollment_id" UUID NOT NULL,
  "code" VARCHAR(80) NOT NULL,
  "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "file_url" TEXT,
  CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "curriculum_modules_course_id_position_key" ON "curriculum_modules"("course_id", "position");
CREATE INDEX "class_sessions_class_id_starts_at_idx" ON "class_sessions"("class_id", "starts_at");
CREATE UNIQUE INDEX "certificates_enrollment_id_key" ON "certificates"("enrollment_id");
CREATE UNIQUE INDEX "certificates_code_key" ON "certificates"("code");
ALTER TABLE "curriculum_modules" ADD CONSTRAINT "curriculum_modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "class_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
