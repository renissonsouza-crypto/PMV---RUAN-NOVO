CREATE TABLE "course_availability_notices" (
  "id" UUID NOT NULL,
  "course_id" UUID NOT NULL,
  "user_id" UUID,
  "phone" VARCHAR(30) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "course_availability_notices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "course_availability_notices_course_id_phone_key" ON "course_availability_notices"("course_id", "phone");
CREATE INDEX "course_availability_notices_course_id_created_at_idx" ON "course_availability_notices"("course_id", "created_at");

ALTER TABLE "course_availability_notices"
  ADD CONSTRAINT "course_availability_notices_course_id_fkey"
  FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_availability_notices"
  ADD CONSTRAINT "course_availability_notices_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
