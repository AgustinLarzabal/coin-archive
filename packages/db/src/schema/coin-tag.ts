import { index, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core"
import { coins } from "./coin.js"
import { tags } from "./tag.js"

export const coinTags = pgTable(
  "coin_tags",
  {
    coinId: uuid("coin_id")
      .notNull()
      .references(() => coins.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({ columns: [table.coinId, table.tagId] }),
    index("coin_tags_tag_id_index").on(table.tagId),
  ]
)
