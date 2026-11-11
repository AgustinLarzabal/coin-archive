import { createSerializationAdapter } from "@tanstack/react-router"

import {
  InvalidCoinIdError,
  InvalidCoinResponseError,
} from "./archive/coin-detail"
import {
  InvalidCoinListFilterError,
  InvalidCoinListResponseError,
} from "./archive/coins"
import {
  CompositionListRequestError,
  InvalidCompositionListResponseError,
} from "./archive/compositions"
import {
  CurrencyListRequestError,
  InvalidCurrencyListResponseError,
} from "./archive/currencies"
import {
  DistributionListRequestError,
  InvalidDistributionListResponseError,
} from "./archive/distributions"
import {
  EngraverListRequestError,
  InvalidEngraverListResponseError,
} from "./archive/engravers"
import {
  InvalidIssuerListResponseError,
  IssuerListRequestError,
} from "./archive/issuers"
import {
  InvalidMintListResponseError,
  MintListRequestError,
} from "./archive/mints"
import {
  InvalidOrientationListResponseError,
  OrientationListRequestError,
} from "./archive/orientations"
import {
  InvalidRulingAuthorityListResponseError,
  RulingAuthorityListRequestError,
} from "./archive/rulers"
import {
  InvalidShapeListResponseError,
  ShapeListRequestError,
} from "./archive/shapes"
import {
  InvalidTagListResponseError,
  TagListRequestError,
} from "./archive/tags"
import {
  InvalidTechniqueListResponseError,
  TechniqueListRequestError,
} from "./archive/techniques"

export {
  coinListQueryOptions,
  InvalidCoinListResponseError,
} from "./archive/coins"
export type { CoinListFilters } from "./archive/coins"
export {
  coinDetailQueryOptions,
  CoinNotFoundError,
  InvalidCoinIdError,
  InvalidCoinResponseError,
  validateCoinId,
} from "./archive/coin-detail"
export { tagListQueryOptions } from "./archive/tags"
export { mintListQueryOptions } from "./archive/mints"
export { currencyListQueryOptions } from "./archive/currencies"
export { distributionListQueryOptions } from "./archive/distributions"
export { techniqueListQueryOptions } from "./archive/techniques"
export { compositionListQueryOptions } from "./archive/compositions"
export { shapeListQueryOptions } from "./archive/shapes"
export { orientationListQueryOptions } from "./archive/orientations"
export { engraverListQueryOptions } from "./archive/engravers"
export {
  InvalidIssuerListResponseError,
  issuerListQueryOptions,
  IssuerListRequestError,
} from "./archive/issuers"
export { rulingAuthorityListQueryOptions } from "./archive/rulers"

function errorAdapter(key: string, ErrorType: new (message: string) => Error) {
  return createSerializationAdapter({
    key,
    test: (value): value is Error => value instanceof ErrorType,
    // Preserve the UI error type without sending causes or stacks to the browser.
    toSerializable: (error) => error.message,
    fromSerializable: (message) => new ErrorType(message),
  })
}

export const archiveErrorSerializationAdapters = [
  errorAdapter("InvalidTagListResponseError", InvalidTagListResponseError),
  errorAdapter("TagListRequestError", TagListRequestError),
  errorAdapter(
    "InvalidCompositionListResponseError",
    InvalidCompositionListResponseError
  ),
  errorAdapter("CompositionListRequestError", CompositionListRequestError),
  errorAdapter("InvalidShapeListResponseError", InvalidShapeListResponseError),
  errorAdapter("ShapeListRequestError", ShapeListRequestError),
  errorAdapter(
    "InvalidOrientationListResponseError",
    InvalidOrientationListResponseError
  ),
  errorAdapter("OrientationListRequestError", OrientationListRequestError),
  errorAdapter("InvalidMintListResponseError", InvalidMintListResponseError),
  errorAdapter("MintListRequestError", MintListRequestError),
  errorAdapter("InvalidCoinIdError", InvalidCoinIdError),
  errorAdapter("InvalidCoinResponseError", InvalidCoinResponseError),
  errorAdapter("InvalidCoinListFilterError", InvalidCoinListFilterError),
  errorAdapter("InvalidCoinListResponseError", InvalidCoinListResponseError),
  errorAdapter(
    "InvalidCurrencyListResponseError",
    InvalidCurrencyListResponseError
  ),
  errorAdapter("CurrencyListRequestError", CurrencyListRequestError),
  errorAdapter(
    "InvalidDistributionListResponseError",
    InvalidDistributionListResponseError
  ),
  errorAdapter("DistributionListRequestError", DistributionListRequestError),
  errorAdapter(
    "InvalidTechniqueListResponseError",
    InvalidTechniqueListResponseError
  ),
  errorAdapter("TechniqueListRequestError", TechniqueListRequestError),
  errorAdapter(
    "InvalidEngraverListResponseError",
    InvalidEngraverListResponseError
  ),
  errorAdapter("EngraverListRequestError", EngraverListRequestError),
  errorAdapter(
    "InvalidIssuerListResponseError",
    InvalidIssuerListResponseError
  ),
  errorAdapter("IssuerListRequestError", IssuerListRequestError),
  errorAdapter(
    "InvalidRulingAuthorityListResponseError",
    InvalidRulingAuthorityListResponseError
  ),
  errorAdapter(
    "RulingAuthorityListRequestError",
    RulingAuthorityListRequestError
  ),
]
