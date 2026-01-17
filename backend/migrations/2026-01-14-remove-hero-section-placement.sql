-- Remove HERO_SECTION from ad placement ENUM
-- This migration removes the HERO_SECTION placement option

-- First, update any existing ads with HERO_SECTION to BANNER_SLIDER
UPDATE ad_banners SET placement = 'BANNER_SLIDER' WHERE placement = 'HERO_SECTION';

-- Then modify the ENUM to remove HERO_SECTION
ALTER TABLE ad_banners MODIFY COLUMN placement ENUM('BANNER_SLIDER', 'SIDEBAR_LEFT', 'SIDEBAR_RIGHT') DEFAULT 'SIDEBAR_RIGHT';
