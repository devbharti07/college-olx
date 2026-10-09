-- AlterTable: Replace passwordHash with keycloakUserId, make collegeEmail optional
ALTER TABLE "users" DROP COLUMN "passwordHash",
ADD COLUMN "keycloakUserId" VARCHAR(255) NOT NULL,
ALTER COLUMN "collegeEmail" DROP NOT NULL,
ALTER COLUMN "college" SET DEFAULT 'Campus';

-- CreateIndex
CREATE UNIQUE INDEX "users_keycloakUserId_key" ON "users"("keycloakUserId");

-- CreateIndex
CREATE INDEX "users_keycloakUserId_idx" ON "users"("keycloakUserId");
