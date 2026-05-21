import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";

interface FeatureDisabledProps {
  title: string;
  description: string;
}

const FeatureDisabled = ({ title, description }: FeatureDisabledProps) => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container py-24 text-center">
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-12 shadow-lg">
        <h1 className="font-display text-3xl font-bold text-foreground">
          {title}
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          {description}
        </p>
        <div className="mt-8 flex justify-center">
          <Link to="/">
            <Button variant="outline">Back to Forum</Button>
          </Link>
        </div>
      </div>
    </main>
  </div>
);

export default FeatureDisabled;
