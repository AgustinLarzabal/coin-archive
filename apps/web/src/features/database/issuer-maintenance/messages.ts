export const ISSUER_AUTHORIZATION_ERROR =
  "Only Editors and Admins can maintain Issuers."
export const ISSUER_DUPLICATE_CODE_ERROR =
  "An Issuer with this code already exists."
export const ISSUER_GENERIC_SAVE_ERROR = "Unable to save Issuer right now."
export const ISSUER_MISSING_ERROR = "Issuer no longer exists."
export const ISSUER_INVALID_CODE_ERROR =
  "Issuer Code must use lowercase letters, numbers, and hyphens only."
export const ISSUER_INVALID_ISO_CODE_ERROR =
  "Issuer ISO Code must be a two-letter ISO 3166-1 alpha-2 code."
export const ISSUER_MISSING_PARENT_ERROR =
  "Selected Parent Issuer no longer exists."
export const ISSUER_SELF_PARENT_ERROR =
  "Issuer cannot be its own Parent Issuer."
export const ISSUER_CYCLIC_PARENT_ERROR =
  "Parent Issuer cannot be a descendant of this Issuer."
export const ISSUER_COINS_DELETE_ERROR =
  "Issuer cannot be deleted while Coins still use it. Remove or reassign the Issuer on those Coins before deleting it."
export const ISSUER_CHILDREN_DELETE_ERROR =
  "Issuer cannot be deleted while child Issuers still reference it. Reassign or remove those child Issuers before deleting this Issuer."
export const ISSUER_CREATED_MESSAGE = "Issuer added."
export const ISSUER_UPDATED_MESSAGE = "Saved."
export const ISSUER_DELETED_MESSAGE = "Issuer deleted."
export const ISSUER_DELETE_CONFIRMATION_DESCRIPTION =
  "This permanently deletes the Issuer. Deletion is blocked while Coins still use it or child Issuers still reference it."
