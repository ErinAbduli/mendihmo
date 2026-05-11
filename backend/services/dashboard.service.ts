import { prisma } from "../lib/prisma.ts";

type RevenuePoint = {
  month: string;
  revenue: number;
};

type TopDonationPoint = {
  campaign: string;
  amount: number;
};

const formatMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString("sq-AL", {
    month: "short",
    year: "numeric",
  });

export const getDashboardStats = async () => {
  const now = new Date();
  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
  const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
  return {
    key: formatMonthKey(date),
    month: formatMonthLabel(date),
  };
  });

  const [revenueTransactions, topDonationTotals, campaignsById] = await Promise.all([
  prisma.transaction.findMany({
    select: {
      amount: true,
      createdAt: true,
    },
  }),
  prisma.transaction.groupBy({
    by: ["campaignId"],
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 5,
  }),
  prisma.campaign.findMany({
    select: {
      id: true,
      title: true,
    },
  }),
  ]);

  const revenueByMonth = new Map<string, number>();

  for (const transaction of revenueTransactions) {
  const key = formatMonthKey(new Date(transaction.createdAt));
  if (!monthBuckets.some((bucket) => bucket.key === key)) {
    continue;
  }
  revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + transaction.amount);
  }

  const revenueOverTime: RevenuePoint[] = monthBuckets.map((bucket) => ({
  month: bucket.month,
  revenue: Number((revenueByMonth.get(bucket.key) ?? 0).toFixed(2)),
  }));

  const campaignTitleById = new Map(
  campaignsById.map((campaign) => [campaign.id, campaign.title]),
  );

  const topDonations: TopDonationPoint[] = topDonationTotals.map((entry) => ({
  campaign: campaignTitleById.get(entry.campaignId) ?? "Fushatë e panjohur",
  amount: Number((entry._sum.amount ?? 0).toFixed(2)),
  }));

  const revenueAgg = await prisma.transaction.aggregate({
    _sum: { amount: true },
  });

  const revenue = revenueAgg._sum?.amount ?? 0;

  const campaignsTotal = await prisma.campaign.count();
  const campaignsFunded = await prisma.campaign.count({
    where: { status: "funded" },
  });

  const usersTotal = await prisma.user.count();

  return {
    revenue: { value: Number(revenue.toFixed(2)), delta: "0%" },
    campaigns: { total: campaignsTotal, funded: campaignsFunded, delta: "0%" },
    users: { value: usersTotal, delta: "0%" },
    revenueOverTime,
    topDonations,
  };
};

export default { getDashboardStats };
