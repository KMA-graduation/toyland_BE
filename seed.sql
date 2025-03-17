BEGIN;
INSERT INTO "public"."branches" ("id", "name", "slug", "logo", "is_active", "created_at", "updated_at") VALUES (1, 'Apple Watch', 'apple-watch', NULL, 't', '2024-04-24 15:16:20.774899+00', '2024-04-24 15:16:20.774899+00');
INSERT INTO "public"."branches" ("id", "name", "slug", "logo", "is_active", "created_at", "updated_at") VALUES (2, 'Samsung', 'samsung', NULL, 't', '2024-04-24 15:16:31.645892+00', '2024-04-24 15:16:31.645892+00');
INSERT INTO "public"."branches" ("id", "name", "slug", "logo", "is_active", "created_at", "updated_at") VALUES (3, 'Xiaomi', 'xiaomi', NULL, 't', '2024-04-24 15:19:20.172076+00', '2024-04-24 15:19:20.172076+00');
INSERT INTO "public"."branches" ("id", "name", "slug", "logo", "is_active", "created_at", "updated_at") VALUES (4, 'Garmin', 'garmin', NULL, 't', '2024-04-24 15:19:27.160093+00', '2024-04-24 15:19:27.160093+00');
INSERT INTO "public"."branches" ("id", "name", "slug", "logo", "is_active", "created_at", "updated_at") VALUES (5, 'Amazfit', 'amazfit', NULL, 't', '2024-04-24 15:19:39.86952+00', '2024-04-24 15:19:39.86952+00');
COMMIT;

BEGIN;
INSERT INTO "public"."categories" ("id", "name", "description", "thumb", "slug", "is_active", "created_at", "updated_at") VALUES (1, 'Đồng hồ thông minh', NULL, NULL, 'dong-ho-thong-minh', 't', '2024-04-24 15:10:27.670608+00', '2024-04-24 15:10:27.670608+00');
INSERT INTO "public"."categories" ("id", "name", "description", "thumb", "slug", "is_active", "created_at", "updated_at") VALUES (2, 'Vòng đeo tay thông minh', NULL, NULL, 'vong-deo-tay-thong-minh', 't', '2024-04-24 15:11:03.143927+00', '2024-04-24 15:11:03.143927+00');
INSERT INTO "public"."categories" ("id", "name", "description", "thumb", "slug", "is_active", "created_at", "updated_at") VALUES (3, 'Dây đeo đồng hồ ', NULL, NULL, 'day-deo-dong-ho', 't', '2024-04-24 15:11:22.21062+00', '2024-04-24 15:11:22.21062+00');
INSERT INTO "public"."categories" ("id", "name", "description", "thumb", "slug", "is_active", "created_at", "updated_at") VALUES (4, 'Đồng hồ nam', NULL, NULL, 'dong-ho-nam', 't', '2024-04-24 15:12:38.802923+00', '2024-04-24 15:12:38.802923+00');
INSERT INTO "public"."categories" ("id", "name", "description", "thumb", "slug", "is_active", "created_at", "updated_at") VALUES (5, 'Đồng hồ nữ', NULL, NULL, 'dong-ho-nu', 't', '2024-04-24 15:12:42.897159+00', '2024-04-24 15:12:42.897159+00');
COMMIT;

BEGIN;
INSERT INTO "public"."products" ("id", "category_id", "shopify_id", "shop_base_id", "branch_id", "name", "slug", "description", "price", "sale_price", "stock_amount", "sold", "type", "is_active", "created_at", "updated_at") VALUES (1, 1, NULL, NULL, 1, 'Apple Watch SE 2 2023 40mm (GPS) viền nhôm | Chính hãng Apple Việt Nam (Đen)', 'apple-watch-se-2-2023-40mm-gps-vien-nhom-chinh-hang-apple-viet-nam-den', NULL, 6390000, NULL, 1000, 0, 'watch', 't', '2024-04-24 15:28:44.847496+00', '2024-04-24 15:28:44.847496+00');
INSERT INTO "public"."products" ("id", "category_id", "shopify_id", "shop_base_id", "branch_id", "name", "slug", "description", "price", "sale_price", "stock_amount", "sold", "type", "is_active", "created_at", "updated_at") VALUES (3, 1, NULL, NULL, 1, 'Apple Watch Series 9 45mm (GPS) viền nhôm dây cao su | Chính hãng Apple Việt Nam (Hồng)', 'apple-watch-series-9-45mm-gps-vien-nhom-day-cao-su-chinh-hang-apple-viet-nam-hong', NULL, 11290000, NULL, 1000, 0, 'watch', 't', '2024-04-24 15:33:01.39574+00', '2024-04-24 15:33:01.39574+00');
INSERT INTO "public"."products" ("id", "category_id", "shopify_id", "shop_base_id", "branch_id", "name", "slug", "description", "price", "sale_price", "stock_amount", "sold", "type", "is_active", "created_at", "updated_at") VALUES (4, 1, NULL, NULL, 1, 'Apple Watch SE 2 2023 40mm (4G) viền nhôm | Chính hãng Apple Việt Nam (Hồng)', 'apple-watch-se-2-2023-40mm-4g-vien-nhom-chinh-hang-apple-viet-nam-hong', NULL, 7090000, NULL, 1000, 0, 'watch', 't', '2024-04-24 15:35:59.687136+00', '2024-04-24 15:35:59.687136+00');
INSERT INTO "public"."products" ("id", "category_id", "shopify_id", "shop_base_id", "branch_id", "name", "slug", "description", "price", "sale_price", "stock_amount", "sold", "type", "is_active", "created_at", "updated_at") VALUES (5, 1, NULL, NULL, 5, 'Đồng hồ thông minh Amazfit GTR mini', 'dong-ho-thong-minh-amazfit-gtr-mini', NULL, 7090000, NULL, 1000, 0, 'watch', 't', '2024-04-24 15:41:55.895929+00', '2024-04-24 15:41:55.895929+00');
INSERT INTO "public"."products" ("id", "category_id", "shopify_id", "shop_base_id", "branch_id", "name", "slug", "description", "price", "sale_price", "stock_amount", "sold", "type", "is_active", "created_at", "updated_at") VALUES (6, 1, NULL, NULL, 5, 'Đồng hồ thông minh Amazfit Active', 'dong-ho-thong-minh-amazfit-active', NULL, 2690000, NULL, 1000, 0, 'watch', 't', '2024-04-24 15:42:43.889042+00', '2024-04-24 15:42:43.889042+00');
INSERT INTO "public"."products" ("id", "category_id", "shopify_id", "shop_base_id", "branch_id", "name", "slug", "description", "price", "sale_price", "stock_amount", "sold", "type", "is_active", "created_at", "updated_at") VALUES (7, 1, NULL, NULL, 5, 'Đồng hồ thông minh Amazfit GTS 4', 'dong-ho-thong-minh-amazfit-gts-4', NULL, 3590000, NULL, 1000, 0, 'watch', 't', '2024-04-24 15:43:32.968032+00', '2024-04-24 15:43:32.968032+00');
COMMIT;


BEGIN;
INSERT INTO "public"."product_images" ("id", "product_id", "url", "is_active", "created_at", "updated_at") VALUES (1, 1, 'https://res.cloudinary.com/dcnaqaepq/image/upload/v1713972526/uploads/products/dxtkmbogo4xtyuihdugf.webp', 't', '2024-04-24 15:28:44.847496+00', '2024-04-24 15:28:44.847496+00');
INSERT INTO "public"."product_images" ("id", "product_id", "url", "is_active", "created_at", "updated_at") VALUES (3, 3, 'https://res.cloudinary.com/dcnaqaepq/image/upload/v1713972782/uploads/products/hn86vafy4mw6nsxhllhn.webp', 't', '2024-04-24 15:33:01.39574+00', '2024-04-24 15:33:01.39574+00');
INSERT INTO "public"."product_images" ("id", "product_id", "url", "is_active", "created_at", "updated_at") VALUES (4, 4, 'https://res.cloudinary.com/dcnaqaepq/image/upload/v1713972960/uploads/products/tshvdwgtfgftsio34e5g.webp', 't', '2024-04-24 15:35:59.687136+00', '2024-04-24 15:35:59.687136+00');
INSERT INTO "public"."product_images" ("id", "product_id", "url", "is_active", "created_at", "updated_at") VALUES (5, 5, 'https://res.cloudinary.com/dcnaqaepq/image/upload/v1713973317/uploads/products/tpyznggnu1ydxs7myiug.webp', 't', '2024-04-24 15:41:55.895929+00', '2024-04-24 15:41:55.895929+00');
INSERT INTO "public"."product_images" ("id", "product_id", "url", "is_active", "created_at", "updated_at") VALUES (6, 5, 'https://res.cloudinary.com/dcnaqaepq/image/upload/v1713973317/uploads/products/rcnu3t5ffopomhhpkac3.webp', 't', '2024-04-24 15:41:55.895929+00', '2024-04-24 15:41:55.895929+00');
INSERT INTO "public"."product_images" ("id", "product_id", "url", "is_active", "created_at", "updated_at") VALUES (7, 6, 'https://res.cloudinary.com/dcnaqaepq/image/upload/v1713973380/uploads/products/omepvws3b3eyhey8qnoe.webp', 't', '2024-04-24 15:42:43.889042+00', '2024-04-24 15:42:43.889042+00');
INSERT INTO "public"."product_images" ("id", "product_id", "url", "is_active", "created_at", "updated_at") VALUES (8, 7, 'https://res.cloudinary.com/dcnaqaepq/image/upload/v1713973414/uploads/products/spi0h2edieolodmbfasr.webp', 't', '2024-04-24 15:43:32.968032+00', '2024-04-24 15:43:32.968032+00');
COMMIT;


BEGIN;
INSERT INTO "public"."users" ("id", "email", "username", "password", "role", "is_active", "created_at", "updated_at") VALUES (1, 'vandungday@gmail.com', 'vandungday', '$2b$07$KAX0Ckria4nGBfy7Ths8JeSn5fU6PjiDkKAhDY2r/cMNBTkGOcuYi', 0, 't', '2024-04-24 15:07:06.256057+00', '2024-04-24 15:07:06.256057+00');
INSERT INTO "public"."users" ("id", "email", "username", "password", "role", "is_active", "created_at", "updated_at") VALUES (2, 'admin@gmail.com', 'admin', '$2b$07$L7.lXL7ywrVOmkPs1F0w4.w0zMe7JZrOHJQ66yaFxGPVQM.A6zgJ6', 1, 't', '2024-04-24 15:07:14.396549+00', '2024-04-24 15:07:14.396549+00');
INSERT INTO "public"."users" ("id", "email", "username", "password", "role", "is_active", "created_at", "updated_at") VALUES (3, 'cuongcter@gmail.com', 'cuongcter', '$2b$07$eb0OYy018F1p.MkvPfzfuO0/8Zd2HZod5r/Izn0J1txYdfrfdCf5O', 0, 't', '2024-04-24 15:08:00.33435+00', '2024-04-24 15:08:00.33435+00');
COMMIT;

DO $$
DECLARE
    max_id bigint;
BEGIN
    SELECT MAX(id) INTO max_id FROM users;
    EXECUTE 'ALTER SEQUENCE users_id_seq RESTART WITH ' || (max_id + 1);
END $$;


DO $$
DECLARE
    max_id bigint;
BEGIN
    SELECT MAX(id) INTO max_id FROM branches;
    EXECUTE 'ALTER SEQUENCE branches_id_seq RESTART WITH ' || (max_id + 1);
END $$;


DO $$
DECLARE
    max_id bigint;
BEGIN
    SELECT MAX(id) INTO max_id FROM categories;
    EXECUTE 'ALTER SEQUENCE categories_id_seq RESTART WITH ' || (max_id + 1);
END $$;


DO $$
DECLARE
    max_id bigint;
BEGIN
    SELECT MAX(id) INTO max_id FROM products;
    EXECUTE 'ALTER SEQUENCE products_id_seq RESTART WITH ' || (max_id + 1);
END $$;

DO $$
DECLARE
    max_id bigint;
BEGIN
    SELECT MAX(id) INTO max_id FROM product_images;
    EXECUTE 'ALTER SEQUENCE product_images_id_seq RESTART WITH ' || (max_id + 1);
END $$;


-- DROP SCHEMA public CASCADE;

-- CREATE SCHEMA public;


-- DO $$
-- DECLARE
--     max_id bigint;
-- BEGIN
--     SELECT MAX(id) INTO max_id FROM orders;
--     EXECUTE 'ALTER SEQUENCE orders_id_seq RESTART WITH ' || (max_id + 1);
-- END $$;


-- DO $$
-- DECLARE
--     max_id bigint;
-- BEGIN
--     SELECT MAX(id) INTO max_id FROM order_details;
--     EXECUTE 'ALTER SEQUENCE order_details_id_seq RESTART WITH ' || (max_id + 1);
-- END $$;
