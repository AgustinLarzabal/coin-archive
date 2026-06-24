DO $$
BEGIN
	IF to_regclass('public.coin_reference_coin_id_catalogue_id_normalized_number_unique_id') IS NOT NULL
	AND to_regclass('public.coin_reference_coin_catalogue_number_unique_idx') IS NULL THEN
		ALTER INDEX "coin_reference_coin_id_catalogue_id_normalized_number_unique_id"
			RENAME TO "coin_reference_coin_catalogue_number_unique_idx";
	END IF;
END $$;
