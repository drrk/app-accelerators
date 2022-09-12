import { ReactNode } from "react";
import { Layout } from "antd";
import Header from "./Header";
import Footer from "./Footer";

import { LoadingSpinner } from "./LoadingSpinner";
import styles from "../../styles/Layout.module.scss";

const LayoutComponent = ({
  children,
  isLoading,
}: {
  children: ReactNode;
  isLoading: boolean;
}) => {
  const { Content } = Layout;
  return (
    <Layout>
      <Header />
      <LoadingSpinner isLoading={isLoading}>
        <Content className={styles.mainContent}>
          {children}
        </Content>
      </LoadingSpinner>
      <Footer />
    </Layout>
  );
};

export default LayoutComponent;
