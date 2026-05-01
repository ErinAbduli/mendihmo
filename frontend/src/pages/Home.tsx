import Hero from "@/components/hero";
import { HowItWorks } from "@/components/ui/how-it-works";
import PlaftormStats from "@/components/plaftorm-stats";
import SuccessfulCampaignsWeek from "@/components/successful-campaigns-week";
import Testimonials from "@/components/ui/testimonials-columns-1";
import CallToAction from "@/components/ui/call-to-action-1";
const Home = () => {
	return (
		<>
			<Hero />
			<SuccessfulCampaignsWeek />
			<HowItWorks />
			<PlaftormStats />
			<Testimonials />
			<CallToAction />
		</>
	);
};

export default Home;
