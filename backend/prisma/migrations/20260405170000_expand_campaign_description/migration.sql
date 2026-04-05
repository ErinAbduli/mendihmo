-- Allow longer campaign descriptions than VARCHAR(191)
ALTER TABLE `Campaign`
  MODIFY `description` TEXT NOT NULL;
