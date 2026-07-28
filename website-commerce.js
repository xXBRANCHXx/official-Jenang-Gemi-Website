const CATALOG_URL = 'https://admin.jenanggemi.com/api/jenang-gemi-store/?action=catalog';
const ORDER_URL = 'https://admin.jenanggemi.com/api/jenang-gemi-website-orders/';

const compact = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/jenang|gemi/g, '')
  .replace(/[^a-z0-9]+/g, '');

let catalogPromise = null;

export const loadJenangGemiCatalog = () => {
  if (catalogPromise) return catalogPromise;
  catalogPromise = fetch(CATALOG_URL, { headers: { Accept: 'application/json' }, credentials: 'omit', cache: 'no-store' })
    .then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(payload.data)) throw new Error(payload.error || 'Jenang Gemi catalog is unavailable.');
      return payload.data;
    });
  return catalogPromise;
};

export const isJenangGemiCatalogItemSelectable = (item) => Boolean(item) && (
  item.available === true || (
    Number(item.is_active) === 1 &&
    Boolean(item.sku_linked) &&
    String(item.sku || '').trim() !== '' &&
    Number(item.stock || 0) > 0
  )
);

export const isJenangGemiCatalogItemCheckoutReady = (item) => (
  isJenangGemiCatalogItemSelectable(item) &&
  Number(item.sale_price || item.site_price || 0) > 0
);

export const matchJenangGemiCatalogItem = (catalog, selection, { requireWebsitePrice = true } = {}) => {
  const product = compact(selection.name || selection.productName);
  const flavor = compact(selection.flavor || selection.optionName);
  const packageLabel = compact(selection.qtyLabel || selection.packageLabel || selection.sizeLabel);
  const packageQuantity = String(selection.qtyLabel || selection.packageLabel || '').match(/\d+/)?.[0] || '';
  return (Array.isArray(catalog) ? catalog : []).find((item) => {
    if (requireWebsitePrice
      ? !isJenangGemiCatalogItemCheckoutReady(item)
      : !isJenangGemiCatalogItemSelectable(item)) return false;
    const itemProduct = compact(`${item.product_slug} ${item.product_name}`);
    const itemFlavor = compact(`${item.option_id} ${item.option_name}`);
    const itemSize = compact(`${item.size_id} ${item.size_label}`);
    const productMatches = product && (itemProduct.includes(product) || product.includes(itemProduct) || (product.includes('bubur') && itemProduct.includes('bubur')) || (product.includes('jamu') && itemProduct.includes('jamu')));
    const flavorMatches = !flavor || itemFlavor.includes(flavor) || flavor.includes(itemFlavor)
      || (product.includes('jamu') && itemFlavor.includes('unflavored'));
    const sizeMatches = !packageLabel || itemSize.includes(packageLabel) || packageLabel.includes(itemSize) || (packageQuantity !== '' && itemSize.includes(packageQuantity));
    return productMatches && flavorMatches && sizeMatches;
  }) || null;
};

export const createCheckoutKey = () => window.crypto?.randomUUID
  ? `jg-${window.crypto.randomUUID()}`
  : `jg-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const createJenangGemiWebsiteOrder = async ({ catalog, items, customer, idempotencyKey }) => {
  const resolvedItems = items.map((item) => {
    const catalogItem = item.catalogItem || matchJenangGemiCatalogItem(catalog, item);
    if (!catalogItem) throw new Error(`${item.name || 'Product'} ${item.flavor || ''} ${item.qtyLabel || ''} is not available from the live catalog.`);
    return { item_key: catalogItem.item_key, sku: catalogItem.sku, quantity: Number(item.quantity || 1) };
  });
  const response = await fetch(ORDER_URL, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Idempotency-Key': idempotencyKey },
    body: JSON.stringify({
      platform: 'jenang_gemi_website',
      idempotency_key: idempotencyKey,
      customer: { name: customer.fullName, address: customer.address },
      items: resolvedItems,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.order?.order_id) throw new Error(payload.error || 'Unable to create the Jenang Gemi order.');
  return payload.order;
};
