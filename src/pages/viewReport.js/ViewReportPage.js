import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './ViewReportPage.module.css';
import Navbar from '../../components/pieces/navbar/Navbar';
import axios from 'axios';

const ViewReportPage = () => {
  const [lcrTypes, setLcrTypes] = useState([]);
  const [hcTypes, setHcTypes] = useState([]);
  const [filterLcrType, setFilterLcrType] = useState('');
  const [filterHcType, setFilterHcType] = useState('');
  const [filterDate, setFilterDate] = useState(null);

  const [rawData, setRawData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / perPage);

  const token = localStorage.getItem('token');

  // Fetch case types for dropdowns
  useEffect(() => {
    const fetchCaseTypes = async () => {
      try {
        const [lcrRes, hcRes] = await Promise.all([
          axios.get(`${process.env.BACKEND_BASE_URL}case-types?type=lcr`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.BACKEND_BASE_URL}case-types?type=hcc`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setLcrTypes(lcrRes?.data?.data || []);
        setHcTypes(hcRes?.data?.data || []);
      } catch (err) {
        console.error('Error fetching case types:', err);
      }
    };

    fetchCaseTypes();
  }, [token]);

  // Fetch order-data with filters
  const fetchData = async (page = 1) => {
    try {
      const params = {
        page,
        lcrCaseType: filterLcrType || undefined,
        hccCaseType: filterHcType || undefined,
        orderDate: filterDate ? filterDate.toISOString().split('T')[0] : undefined,
      };

      const res = await axios.get(`${process.env.BACKEND_BASE_URL}admin/order-data`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const pageData = res?.data?.data?.data;
      const apiData = pageData?.data || [];

      setRawData([...apiData].reverse()); // latest first
      setPerPage(pageData?.per_page || 5);
      setTotal(pageData?.total || apiData.length);
      setCurrentPage(pageData?.current_page || 1);
    } catch (err) {
      console.error('Error fetching order-data:', err);
    }
  };

  // Initial fetch & whenever filters change
  useEffect(() => {
    fetchData(1);
  }, [filterLcrType, filterHcType, filterDate]);

  const clearFilters = () => {
    setFilterLcrType('');
    setFilterHcType('');
    setFilterDate(null);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    fetchData(page);
  };

  return (
    <div>
      <Navbar />
      <div className={styles['search-page']}>
        <div className={styles['search-card']}>
          <h2>Filter Reports / LCR</h2>
          <div className={styles['search-fields-row']}>
            <div className={styles['form-group']}>
              <label htmlFor="filterLcrType">LCR Case Type</label>
              <select
                id="filterLcrType"
                value={filterLcrType}
                onChange={(e) => setFilterLcrType(e.target.value)}
              >
                <option value="">All LCR Types</option>
                {lcrTypes.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.case_name}</option>
                ))}
              </select>
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="filterHcType">HC Case Type</label>
              <select
                id="filterHcType"
                value={filterHcType}
                onChange={(e) => setFilterHcType(e.target.value)}
              >
                <option value="">All HC Types</option>
                {hcTypes.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.case_name}</option>
                ))}
              </select>
            </div>

            <div className={styles['form-group']}>
              <label>Date</label>
              <DatePicker
                selected={filterDate}
                onChange={(date) => setFilterDate(date)}
                placeholderText="Select date"
              />
            </div>

            <div className={styles['form-group']} style={{ alignSelf: 'flex-end' }}>
              <button type="button" className={styles['clear-button']} onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className={styles['results-card']}>
          <h3>Results</h3>
          {rawData.length === 0 ? (
            <p className={styles['no-results']}>No results found.</p>
          ) : (
            <>
              <table className={styles['results-table']}>
                <thead>
                  <tr>
                    <th>Sl.No</th>
                    <th>LCR Case No.</th>
                    <th>HC Case No.</th>
                    <th>Order Date</th>
                    <th>Case Status</th>
                    <th>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {rawData.map((item, index) => (
                    <tr key={item.id}>
                      <td>{(currentPage - 1) * perPage + index + 1}</td>
                      <td>{item.lcrCaseNo}</td>
                      <td>{item.highcourt_case_no}</td>
                      <td>{new Date(item.order_date).toLocaleDateString()}</td>
                      <td>
                        <span
                          className={`${styles['status-badge']} ${
                            item.case_status === 'pending'
                              ? styles['pending']
                              : item.case_status === 'stayed'
                              ? styles['stayed']
                              : item.case_status === 'disposed'
                              ? styles['disposed']
                              : ''
                          }`}
                        >
                          {item.case_status.charAt(0).toUpperCase() + item.case_status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <a href={`${process.env.BACKEND_PDF_URL}${item.pdf_name}`} target="_blank" rel="noopener noreferrer">
                          View PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className={styles['pagination']}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ⬅ Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={currentPage === i + 1 ? styles['active-page'] : ''}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next ➡
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewReportPage;
