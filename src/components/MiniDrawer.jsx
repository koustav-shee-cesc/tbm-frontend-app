import React, { useState } from 'react';
import {
  FileSearchOutlined,
  DatabaseOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  ReconciliationOutlined,
  LogoutOutlined,
  AppstoreAddOutlined,
  FileAddOutlined,
  BarChartOutlined,

} from '@ant-design/icons';
import { Layout, Menu } from 'antd';
// import { Divider } from 'antd';
import {Link} from 'react-router-dom';

const { Header, Content, Footer, Sider } = Layout;
function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}
const featureItems = [
  getItem(<Link to={`/dashboard`}>Dashboard</Link>, '1', <PieChartOutlined />),
  getItem('Resolving Record', 'Sub1', <DatabaseOutlined /> ,[
    getItem(<Link to={`/pd_resolution_form`}>New Record</Link>, '2', <AppstoreAddOutlined />),
    getItem(<Link to={`/pd_records`}>Show Records</Link>, '3', <BarChartOutlined />)
  ]),
  getItem(<Link to={`/asset_database`}>Asset Database</Link>, '4', <FileSearchOutlined />,),
  getItem('TBMs', 'sub2', <ReconciliationOutlined /> , [
    getItem(<Link to={`/test`}>Allocation</Link>, '5',<ReconciliationOutlined />),
    getItem(<Link to={`/under_construction`}>Fill New TBM</Link>, '6', <FileAddOutlined />), 
    getItem(<Link to={`/under_construction`}>TBM Records</Link>, '7',<ReconciliationOutlined />)
  ]),
  // getItem({type:'divider'}),
  getItem(<Link to={`/useraccount`}>Users</Link>, '8', <TeamOutlined />),
  getItem('Settings', 'sub3', <ReconciliationOutlined /> , [
    getItem(<Link to={`/companies-table`}>Company List</Link>, '9',<ReconciliationOutlined />),
    getItem(<Link to={`/create-company`}>Create Company</Link>, '10', <FileAddOutlined />), 
    getItem(<Link to={`/members-table`}>Members</Link>, '11',<ReconciliationOutlined />),
    getItem(<Link to={`/create-member`}>Create Member</Link>, '12',<ReconciliationOutlined />)
  ]),
  getItem(<Link to={`/under_construction`}>Reports</Link>, '13', <FileOutlined />),
  getItem(<span className='text-orange-600'>Sign Out</span> , '14', <LogoutOutlined style={{color: "#EA580C"}}/>),
];


const MiniDrawer = (props) => {
  // const [collapsed, setCollapsed] = useState(false);

  return (
      <Sider collapsible collapsed={props.collapsed}  trigger={null}>
        <div className="demo-logo-vertical" />
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={featureItems} />
        
        {/* <Menu theme="dark" mode="inline" items={} /> */}
      </Sider>
  );
};
export default MiniDrawer;