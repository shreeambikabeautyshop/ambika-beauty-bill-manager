export interface Product {
  id?: string;
  sr: number;
  name: string;
  qty: number;
  mrp: number;
  rate: number;
  disc: number;
  amount: number;
  bill_id?: string;
  created_at?: string;
}

export interface Bill {
  id?: string;
  bill_no: string;
  bill_date: string;
  supplier_name?: string;
  total_qty: number;
  total_amount: number;
  image_url?: string;
  cloudinary_public_id?: string;
  folder_path?: string;
  products?: Product[];
  created_at?: string;
}

export interface VerifyResult {
  sr: number;
  name: string;
  qty: number;
  mrp: number;
  rate: number;
  bill_disc: number;
  calc_disc: number;
  disc_match: boolean;
  bill_amount: number;
  calc_amount: number;
  amount_match: boolean;
  promised_disc?: number;
  loss?: number;
}

export interface BillVerification {
  bill_no: string;
  bill_date: string;
  total_products: number;
  total_amount: number;
  discrepancies: number;
  total_loss: number;
  results: VerifyResult[];
  summary: string;
}

export interface SearchResult {
  products: Product[];
  query: string;
  total: number;
}

export interface DashboardStats {
  total_bills: number;
  total_products: number;
  total_amount: number;
  total_loss_identified: number;
  latest_bill_date: string;
}
