export const AGRO_SUBMISSION_CATEGORY = 'აგრო-ბირჟის განაცხადი';
export const GRAIN_SUBMISSION_CATEGORY = 'მარცვლეულის განაცხადი';
export const LOST_FOUND_ANNOUNCEMENT_CATEGORY = 'დაკარგული/ნაპოვნი';
export const SERVICE_REQUEST_CATEGORY = 'სერვისის მაძიებელი';
export const SERVICE_ANNOUNCEMENT_CATEGORIES = ['ოსტატი/სპეციალისტი', 'ოსტატი', 'სერვისი'] as const;

type AnnouncementLike = {
  category?: string | null;
  description?: string | null;
};

export function getAgroSubmissionType(row: AnnouncementLike): 'grape' | 'grain' | null {
  if (row.category === AGRO_SUBMISSION_CATEGORY || Boolean(row.description?.includes('აგრო-ბირჟა:'))) {
    return 'grape';
  }

  if (row.category === GRAIN_SUBMISSION_CATEGORY || Boolean(row.description?.includes('მარცვლეული:'))) {
    return 'grain';
  }

  return null;
}

export function isAgroSubmission(row: AnnouncementLike): boolean {
  return getAgroSubmissionType(row) !== null;
}

export function isLostFoundAnnouncement(row: AnnouncementLike): boolean {
  return row.category === LOST_FOUND_ANNOUNCEMENT_CATEGORY;
}

export function isServiceAnnouncement(row: AnnouncementLike): boolean {
  return SERVICE_ANNOUNCEMENT_CATEGORIES.includes(row.category as typeof SERVICE_ANNOUNCEMENT_CATEGORIES[number]);
}

export function isServiceRequestAnnouncement(row: AnnouncementLike): boolean {
  return row.category === SERVICE_REQUEST_CATEGORY;
}

export function isCommunityAnnouncement(row: AnnouncementLike): boolean {
  return isLostFoundAnnouncement(row) || isServiceAnnouncement(row) || isServiceRequestAnnouncement(row);
}
