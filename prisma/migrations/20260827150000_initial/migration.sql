CREATE TYPE "Role" AS ENUM ('ADMIN', 'STUDENT');
CREATE TYPE "CourseStatus" AS ENUM ('OPEN', 'LAST_SPOTS', 'COMING_SOON', 'CLOSED');
CREATE TYPE "Period" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');
CREATE TYPE "ClassStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'APPROVED', 'WAITLIST', 'CANCELLED', 'COMPLETED');

CREATE TABLE "users" ("id" UUID NOT NULL, "name" VARCHAR(120) NOT NULL, "email" VARCHAR(160) NOT NULL, "password_hash" TEXT NOT NULL, "role" "Role" NOT NULL DEFAULT 'STUDENT', "active" BOOLEAN NOT NULL DEFAULT true, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "users_pkey" PRIMARY KEY ("id"));
CREATE TABLE "courses" ("id" UUID NOT NULL, "slug" VARCHAR(80) NOT NULL, "name" VARCHAR(160) NOT NULL, "area" VARCHAR(100) NOT NULL, "area_key" VARCHAR(80) NOT NULL, "image" TEXT NOT NULL, "video_id" VARCHAR(40), "synopsis" TEXT NOT NULL, "status" "CourseStatus" NOT NULL DEFAULT 'COMING_SOON', "duration" VARCHAR(60) NOT NULL, "workload" INTEGER NOT NULL, "salary_range" VARCHAR(100), "indicated_for" TEXT[], "accent_color" VARCHAR(20) NOT NULL DEFAULT '#3b82f6', "published" BOOLEAN NOT NULL DEFAULT true, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "courses_pkey" PRIMARY KEY ("id"));
CREATE TABLE "class_offerings" ("id" UUID NOT NULL, "course_id" UUID NOT NULL, "name" VARCHAR(120) NOT NULL, "period" "Period" NOT NULL, "capacity" INTEGER NOT NULL, "start_date" DATE, "end_date" DATE, "location" VARCHAR(180), "status" "ClassStatus" NOT NULL DEFAULT 'DRAFT', "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "class_offerings_pkey" PRIMARY KEY ("id"));
CREATE TABLE "enrollments" ("id" UUID NOT NULL, "class_id" UUID NOT NULL, "user_id" UUID, "name" VARCHAR(120) NOT NULL, "email" VARCHAR(160) NOT NULL, "cpf" VARCHAR(14) NOT NULL, "phone" VARCHAR(30) NOT NULL, "district" VARCHAR(120) NOT NULL, "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING', "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id"));
CREATE TABLE "suggestions" ("id" UUID NOT NULL, "name" VARCHAR(120) NOT NULL, "district" VARCHAR(120) NOT NULL, "course" VARCHAR(160) NOT NULL, "contact" VARCHAR(160), "reviewed" BOOLEAN NOT NULL DEFAULT false, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id"));
CREATE TABLE "evaluations" ("id" UUID NOT NULL, "user_id" UUID, "rating" INTEGER NOT NULL, "recommend" VARCHAR(20) NOT NULL, "comment" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");
CREATE INDEX "courses_published_status_idx" ON "courses"("published", "status");
CREATE INDEX "class_offerings_course_id_status_idx" ON "class_offerings"("course_id", "status");
CREATE UNIQUE INDEX "enrollments_class_id_cpf_key" ON "enrollments"("class_id", "cpf");
CREATE INDEX "enrollments_status_created_at_idx" ON "enrollments"("status", "created_at");
CREATE INDEX "suggestions_reviewed_created_at_idx" ON "suggestions"("reviewed", "created_at");
CREATE INDEX "evaluations_created_at_idx" ON "evaluations"("created_at");

ALTER TABLE "class_offerings" ADD CONSTRAINT "class_offerings_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "class_offerings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
