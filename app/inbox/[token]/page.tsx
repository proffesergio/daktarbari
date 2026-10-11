import InboxClient from "@/components/InboxClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "সিরিয়াল ইনবক্স | ডাক্তার বাড়ি" };

export default async function InboxPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InboxClient token={token} />;
}
