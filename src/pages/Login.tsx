import FeatureDisabled from "@/components/FeatureDisabled";

const Login = () => (
  <FeatureDisabled
    title="Sign In Disabled"
    description="This app no longer uses Supabase authentication. Connect a backend API first to restore sign-in functionality."
  />
);

export default Login;
