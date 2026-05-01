import json, re, sys

with open(r"C:\Users\guy\Downloads\ledlink\index.html", encoding="utf-8") as f:
    html = f.read()

# Extract __PRODUCTS__ array
m = re.search(r'window\.__PRODUCTS__\s*=\s*(\[[\s\S]*?\]);\s*</script>', html)
if not m:
    print("ERROR: could not find __PRODUCTS__")
    sys.exit(1)

products = json.loads(m.group(1))
print(f"Total products: {len(products)}")

keep = {"פרופילים", "סטריפ LED", "דרייברים"}
filtered = [p for p in products if p.get("category") in keep]
print(f"Filtered products: {len(filtered)}")

by_cat = {}
for p in filtered:
    by_cat.setdefault(p["category"], 0)
    by_cat[p["category"]] += 1
print("By category:", by_cat)

# Save filtered products as JS snippet
out = "window.__PRODUCTS__ = " + json.dumps(filtered, ensure_ascii=False, indent=2) + ";"
with open(r"C:\Users\guy\Desktop\GUY\ledlink-components\products_data.js", "w", encoding="utf-8") as f:
    f.write(out)
print("Saved products_data.js")

# Extract PRODUCT_DATASHEETS
m2 = re.search(r'const\s+PRODUCT_DATASHEETS\s*=\s*(\{[\s\S]*?\});\s*\n', html)
if m2:
    ds = json.loads(m2.group(1))
    # Filter to only products we kept
    kept_ids = {p["id"] for p in filtered}
    ds_filtered = {k: v for k, v in ds.items() if k in kept_ids}
    print(f"Datasheets: {len(ds_filtered)}/{len(ds)}")
    out2 = "const PRODUCT_DATASHEETS = " + json.dumps(ds_filtered, ensure_ascii=False, indent=2) + ";"
    with open(r"C:\Users\guy\Desktop\GUY\ledlink-components\datasheets_data.js", "w", encoding="utf-8") as f:
        f.write(out2)
    print("Saved datasheets_data.js")
else:
    print("WARNING: PRODUCT_DATASHEETS not found")
