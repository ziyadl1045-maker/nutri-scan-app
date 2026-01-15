import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useProduct(barcode: string | null) {
  return useQuery({
    queryKey: [api.products.lookup.path, barcode],
    queryFn: async () => {
      if (!barcode) return null;
      const url = buildUrl(api.products.lookup.path, { barcode });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch product");
      
      return api.products.lookup.responses[200].parse(await res.json());
    },
    enabled: !!barcode,
  });
}
