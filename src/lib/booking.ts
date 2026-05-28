const PIPE = "||";
const SEP = ",";

export function encodeCustomerName(name: string, serviceIds: string[]): string {
  if (serviceIds.length <= 1) return name;
  return `${name}${PIPE}${serviceIds.join(SEP)}`;
}

export function decodeCustomerName(customerName: string | null | undefined): { name: string; serviceIds: string[] } {
  if (!customerName) return { name: "", serviceIds: [] };
  const idx = customerName.indexOf(PIPE);
  if (idx === -1) return { name: customerName, serviceIds: [] };
  return {
    name: customerName.slice(0, idx),
    serviceIds: customerName.slice(idx + PIPE.length).split(SEP).filter(Boolean),
  };
}

export function getServiceNames(
  entry: { service_ids?: string | null; service_id?: string | null; customer_name?: string | null },
  map: Map<string, string>
): string {
  const ids = entry.customer_name?.includes("||")
    ? decodeCustomerName(entry.customer_name).serviceIds
    : entry.service_ids
      ? entry.service_ids.split(",").filter(Boolean)
      : entry.service_id
        ? [entry.service_id]
        : [];
  return ids.map((id) => map.get(id) || "").filter(Boolean).join(" + ");
}
