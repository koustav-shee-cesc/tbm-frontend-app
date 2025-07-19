import React, { useState } from 'react';
import MiniDrawer from '../MiniDrawer'
import FooterElement from '../FooterElement'
import PrimarySearchAppBar from '../PrimarySearchAppBar';
import { Breadcrumb, Layout, theme } from 'antd';
const { Content, Footer } = Layout;
import { Outlet } from 'react-router-dom';


const AppLayout = () => {

  const [collapsed, setCollapsed] = useState(false);

  const handleCollapse = () => {
    setCollapsed(collapsed ? false : true);
  };

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <PrimarySearchAppBar handleCollapse={handleCollapse} />
      <Layout>
        <MiniDrawer collapsed={collapsed} />
        <Content style={{ margin: '0 16px', }}>
          {/* <Breadcrumb style={{ margin: '16px 0', }}>
            <Breadcrumb.Item>User</Breadcrumb.Item>
            <Breadcrumb.Item>Bill</Breadcrumb.Item>
          </Breadcrumb> */}
          <main style={{ padding: 24, minHeight: "75vh", background: colorBgContainer, borderRadius: borderRadiusLG, }}>
            <Outlet/>
          </main>
          <Footer style={{ textAlign: 'center', }}>
            <FooterElement />
          </Footer>
        </Content>
      </Layout>

    </Layout>
  )
}

export default AppLayout