import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from 'react-query';
import { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../components/layout/Layout";
import "../styles/globals.css";
import Notifications from "../components/elements/Notifications";

require("../styles/antd-variables.less");

const queryClient = new QueryClient()

const MyApp = ({ Component, pageProps }: AppProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const Router = useRouter();

  useEffect(() => {
    Router.events.on("routeChangeStart", () => setIsLoading(true));
    Router.events.on("routeChangeComplete", () => setIsLoading(false));
    Router.events.on("routeChangeError", () => setIsLoading(false));
  }, [Router.events]);

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>Reference Web App</title>
        <meta name="description" content="Generated by create next app" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
      </Head>
      <Layout isLoading={isLoading}>
        <Notifications items={[]}/>
        <Component {...pageProps} />
      </Layout>
    </QueryClientProvider>
  );
};

export default MyApp;
