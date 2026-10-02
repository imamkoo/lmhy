import { Metadata } from "next";
import { AdminLiteraClient } from "./AdminLiteraClient";

export const metadata: Metadata = {
  title: "Admin Litera NFT & Tokenomics Setting — Let Me Hear You",
  description:
    "Portal pengaturan resmi publisher dan pendaftaran artikel ke smart contract Litera NFT di jaringan Polygon.",
};

export default function AdminLiteraPage() {
  return <AdminLiteraClient />;
}
