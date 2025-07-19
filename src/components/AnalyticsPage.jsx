import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useAxiosPrivate from '../api/axiosPrivate';
import * as d3 from 'd3'; // Import D3.js

// Define numeric role codes for frontend use (must match backend)
const ROLES = {
  User: 100,
  Editor: 200,
  Admin: 999,
};

const AnalyticsPage = () => {
  const { auth, setAuth } = useAuth();
  const axiosPrivate = useAxiosPrivate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vendorAssetSummary, setVendorAssetSummary] = useState([]);
  const [disconnectedNTRCounts, setDisconnectedNTRCounts] = useState({});
  const [assetTypeBreakup, setAssetTypeBreakup] = useState([]);
  const [districtBreakup, setDistrictBreakup] = useState([]);
  const [inspectedPendingSummary, setInspectedPendingSummary] = useState({});

  // Refs for D3 chart containers
  const vendorAssetChartRef = useRef(null);
  const assetTypeChartRef = useRef(null);
  const districtChartRef = useRef(null);
  const inspectedPendingChartRef = useRef(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError('');

        const [
          vendorAssetRes,
          disconnectedNTRRes,
          assetTypeRes,
          districtRes,
          inspectedPendingRes,
        ] = await Promise.all([
          axiosPrivate.get('/api/analytics/vendor-asset-summary'),
          axiosPrivate.get('/api/analytics/disconnected-ntr-counts'),
          axiosPrivate.get('/api/analytics/asset-type-breakup'),
          axiosPrivate.get('/api/analytics/district-breakup'),
          axiosPrivate.get('/api/analytics/inspected-pending-summary'),
        ]);

        setVendorAssetSummary(vendorAssetRes.data);
        setDisconnectedNTRCounts(disconnectedNTRRes.data);
        setAssetTypeBreakup(assetTypeRes.data);
        setDistrictBreakup(districtRes.data);
        setInspectedPendingSummary(inspectedPendingRes.data);

      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [axiosPrivate]);

  // D3.js chart rendering effects
  useEffect(() => {
    if (vendorAssetSummary.length > 0) {
      drawVendorAssetChart(vendorAssetSummary);
    }
  }, [vendorAssetSummary]);

  useEffect(() => {
    if (assetTypeBreakup.length > 0) {
      drawAssetTypeChart(assetTypeBreakup);
    }
  }, [assetTypeBreakup]);

  useEffect(() => {
    if (districtBreakup.length > 0) {
      drawDistrictChart(districtBreakup);
    }
  }, [districtBreakup]);

  useEffect(() => {
    if (Object.keys(inspectedPendingSummary).length > 0) {
      drawInspectedPendingChart(inspectedPendingSummary);
    }
  }, [inspectedPendingSummary]);


  // D3 Chart Functions

  const drawVendorAssetChart = (data) => {
    d3.select(vendorAssetChartRef.current).selectAll("*").remove(); // Clear previous chart

    const margin = { top: 20, right: 30, bottom: 100, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(vendorAssetChartRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x0 = d3.scaleBand()
      .domain(data.map(d => d.vendor))
      .rangeRound([0, width])
      .paddingInner(0.1);

    const x1 = d3.scaleBand()
      .domain(['allocatedCount', 'inspectedCount', 'pendingCount', 'ntrCount'])
      .rangeRound([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.allocatedCount, d.inspectedCount, d.pendingCount, d.ntrCount))])
      .rangeRound([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(['allocatedCount', 'inspectedCount', 'pendingCount', 'ntrCount'])
      .range(['#6b486b', '#a05d56', '#d0743c', '#ff8c00']);

    const xAxis = g => g
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    const yAxis = g => g
      .call(d3.axisLeft(y).ticks(null, "s"))
      .append("text")
      .attr("x", -margin.left)
      .attr("y", -10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Count");

    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);

    const vendorGroup = svg.selectAll(".vendor-group")
      .data(data)
      .enter().append("g")
      .attr("transform", d => `translate(${x0(d.vendor)},0)`);

    vendorGroup.selectAll("rect")
      .data(d => ['allocatedCount', 'inspectedCount', 'pendingCount', 'ntrCount'].map(key => ({ key, value: d[key], vendor: d.vendor })))
      .enter().append("rect")
      .attr("x", d => x1(d.key))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - y(d.value))
      .attr("fill", d => color(d.key));

    // Legend
    const legend = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
      .selectAll("g")
      .data(color.domain().slice().reverse())
      .enter().append("g")
      .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
      .attr("x", width - 19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", color);

    legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(d => d.replace('Count', ''));
  };

  const drawAssetTypeChart = (data) => {
    d3.select(assetTypeChartRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(assetTypeChartRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.allocatedCount, d.inspectedCount, d.pendingCount))])
      .range([height, 0]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .call(d3.axisLeft(y));

    // Bars for Allocated Count
    svg.selectAll(".bar-allocated")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar-allocated")
      .attr("x", d => x(d.category))
      .attr("y", d => y(d.allocatedCount))
      .attr("width", x.bandwidth() / 3)
      .attr("height", d => height - y(d.allocatedCount))
      .attr("fill", "steelblue");

    // Bars for Inspected Count
    svg.selectAll(".bar-inspected")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar-inspected")
      .attr("x", d => x(d.category) + x.bandwidth() / 3)
      .attr("y", d => y(d.inspectedCount))
      .attr("width", x.bandwidth() / 3)
      .attr("height", d => height - y(d.inspectedCount))
      .attr("fill", "green");

    // Bars for Pending Count
    svg.selectAll(".bar-pending")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar-pending")
      .attr("x", d => x(d.category) + 2 * x.bandwidth() / 3)
      .attr("y", d => y(d.pendingCount))
      .attr("width", x.bandwidth() / 3)
      .attr("height", d => height - y(d.pendingCount))
      .attr("fill", "orange");
  };

  const drawDistrictChart = (data) => {
    d3.select(districtChartRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(districtChartRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.district))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.allocatedCount, d.inspectedCount, d.pendingCount))])
      .range([height, 0]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .call(d3.axisLeft(y));

    // Bars for Allocated Count
    svg.selectAll(".bar-allocated")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar-allocated")
      .attr("x", d => x(d.district))
      .attr("y", d => y(d.allocatedCount))
      .attr("width", x.bandwidth() / 3)
      .attr("height", d => height - y(d.allocatedCount))
      .attr("fill", "steelblue");

    // Bars for Inspected Count
    svg.selectAll(".bar-inspected")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar-inspected")
      .attr("x", d => x(d.district) + x.bandwidth() / 3)
      .attr("y", d => y(d.inspectedCount))
      .attr("width", x.bandwidth() / 3)
      .attr("height", d => height - y(d.inspectedCount))
      .attr("fill", "green");

    // Bars for Pending Count
    svg.selectAll(".bar-pending")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar-pending")
      .attr("x", d => x(d.district) + 2 * x.bandwidth() / 3)
      .attr("y", d => y(d.pendingCount))
      .attr("width", x.bandwidth() / 3)
      .attr("height", d => height - y(d.pendingCount))
      .attr("fill", "orange");
  };

  const drawInspectedPendingChart = (data) => {
    d3.select(inspectedPendingChartRef.current).selectAll("*").remove();

    const chartData = [
      { label: 'Total Allocated', value: data.totalAllocated || 0 },
      { label: 'Total Inspected', value: data.totalInspected || 0 },
      { label: 'Total Pending', value: data.totalPending || 0 },
      { label: 'Total NTR', value: data.totalNTR || 0 },
    ];

    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(inspectedPendingChartRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(chartData.map(d => d.label))
      .range(d3.schemeCategory10);

    const pie = d3.pie()
      .value(d => d.value);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = svg.selectAll("arc")
      .data(pie(chartData))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.label));

    arcs.append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .text(d => `${d.data.label}: ${d.data.value}`);
  };


  const handleLogout = async () => {
    try {
      await axiosPrivate.post('/api/auth/logout');
      setAuth({});
    } catch (err) {
      console.error('Logout failed:', err);
      setAuth({});
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4 font-inter">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>
      <nav className="flex flex-wrap justify-center gap-4 mb-8">
        <Link
          to="/"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Home
        </Link>
        <Link
          to="/dashboard"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Dashboard
        </Link>
        {(auth?.user?.roles?.includes(ROLES.Editor) || auth?.user?.roles?.includes(ROLES.Admin)) && (
          <Link
            to="/editor"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            Editor Panel
          </Link>
        )}
        {auth?.user?.roles?.includes(ROLES.Admin) && (
          <Link
            to="/admin"
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Admin Panel
          </Link>
        )}
        {auth?.accessToken && (
          <button
            onClick={handleLogout}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            Logout
          </button>
        )}
      </nav>

      {loading ? (
        <p className="text-xl text-gray-700 animate-pulse">Loading analytics...</p>
      ) : error ? (
        <p className="text-red-500 text-lg">{error}</p>
      ) : (
        <div className="w-full max-w-6xl space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Overall Inspected vs. Pending Summary</h2>
            <p className="text-lg text-gray-700">
              Total Allocated Assets: <span className="font-semibold">{inspectedPendingSummary.totalAllocated || 0}</span>
            </p>
            <p className="text-lg text-gray-700">
              Total Inspected Assets: <span className="font-semibold">{inspectedPendingSummary.totalInspected || 0}</span>
            </p>
            <p className="text-lg text-gray-700">
              Total Pending Assets: <span className="font-semibold">{inspectedPendingSummary.totalPending || 0}</span>
            </p>
            <p className="text-lg text-gray-700">
              Total NTR Assets: <span className="font-semibold">{inspectedPendingSummary.totalNTR || 0}</span>
            </p>
            <div className="flex justify-center mt-4">
              <svg ref={inspectedPendingChartRef}></svg>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Disconnected & NTR Counts (DS Site Checklists)</h2>
            <p className="text-lg text-gray-700">
              Disconnected Assets: <span className="font-semibold">{disconnectedNTRCounts.disconnectedCount || 0}</span>
            </p>
            <p className="text-lg text-gray-700">
              NTR Assets: <span className="font-semibold">{disconnectedNTRCounts.ntrCount || 0}</span>
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Vendor & Asset Category Summary</h2>
            <svg ref={vendorAssetChartRef}></svg>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Asset Type Breakup (Allocated vs Inspected vs Pending)</h2>
            <svg ref={assetTypeChartRef}></svg>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">District Breakup (Allocated vs Inspected vs Pending)</h2>
            <svg ref={districtChartRef}></svg>
          </div>

        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
