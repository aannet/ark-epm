-- CreateTable
CREATE TABLE "user_domain_scope" (
    "user_id" UUID NOT NULL,
    "domain_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_domain_scope_pkey" PRIMARY KEY ("user_id","domain_id")
);

-- CreateIndex
CREATE INDEX "idx_user_domain_scope_user" ON "user_domain_scope"("user_id");

-- AddForeignKey
ALTER TABLE "user_domain_scope" ADD CONSTRAINT "user_domain_scope_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_domain_scope" ADD CONSTRAINT "user_domain_scope_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;
