import React from 'react';
import Link from 'next/link';
const DashboardPage = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <Link href="/record">Record</Link>
    </div>
  );
};

export default DashboardPage;