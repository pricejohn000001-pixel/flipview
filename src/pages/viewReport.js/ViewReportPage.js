import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './ViewReportPage.module.css';
import Navbar from '../../components/pieces/navbar/Navbar';

// Dummy data (could be fetched from backend)
const dummyData = [
  { id: 1, hcCase: 'Appeal-2021-123', lcrNo: 'Civil-2021-456', date: new Date('2021-06-15') },
  { id: 2, hcCase: 'Revision-2020-789', lcrNo: 'Criminal-2020-321', date: new Date('2020-11-20') },
  { id: 3, hcCase: 'Appeal-2022-555', lcrNo: 'Civil-2022-654', date: new Date('2022-01-05') },
  { id: 4, hcCase: 'Appeal-2023-100', lcrNo: 'Civil-2023-222', date: new Date('2023-03-17') },
  { id: 5, hcCase: 'Revision-2024-200', lcrNo: 'Criminal-2024-333', date: new Date('2024-04-12') },
  { id: 6, hcCase: 'Appeal-2025-999', lcrNo: 'Civil-2025-777', date: new Date('2025-09-15') },
  // add more dummy rows as needed
];

const PAGE_SIZE = 3; // Static for now

const ViewReportPage = () => {
  const [filterLcrNo, setFilterLcrNo] = useState('');
  const [filterHcCase, setFilterHcCase] = useState('');
  const [filterDate, setFilterDate] = useState(null);

  const [filteredData, setFilteredData] = useState(dummyData);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  const lcrNoOptions = Array.from(new Set(dummyData.map(item => item.lcrNo))).sort();
  const hcCaseOptions = Array.from(new Set(dummyData.map(item => item.hcCase))).sort();

  useEffect(() => {
    let filtered = dummyData;

    if (filterLcrNo) {
      filtered = filtered.filter(item => item.lcrNo === filterLcrNo);
    }

    if (filterHcCase) {
      filtered = filtered.filter(item => item.hcCase === filterHcCase);
    }

    if (filterDate) {
      filtered = filtered.filter(item =>
        item.date.toDateString() === filterDate.toDateString()
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to page 1 on filter change
  }, [filterLcrNo, filterHcCase, filterDate]);

  const clearFilters = () => {
    setFilterLcrNo('');
    setFilterHcCase('');
    setFilterDate(null);
  };

  const paginatedResults = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div>
      <Navbar />
      <div className={styles['search-page']}>
        <div className={styles['search-card']}>
          <h2>Filter Reports / LCR</h2>
          <div className={styles['search-fields-row']}>
          <div className={styles['form-group']}>
            <label htmlFor="filterLcrNo">LCR Case No.</label>
            <select
              id="filterLcrNo"
              value={filterLcrNo}
              onChange={(e) => setFilterLcrNo(e.target.value)}
            >
              <option value="">All LCRs</option>
              {lcrNoOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="filterHcCase">HC Case No.</label>
            <select
              id="filterHcCase"
              value={filterHcCase}
              onChange={(e) => setFilterHcCase(e.target.value)}
            >
              <option value="">All HC Cases</option>
              {hcCaseOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
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
            <button className={styles['clear-button']} onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
        </div>

        <div className={styles['results-card']}>
          <h3>Results</h3>
          {paginatedResults.length === 0 ? (
            <p className={styles['no-results']}>No results found.</p>
          ) : (
            <>
              <table className={styles['results-table']}>
                <thead>
                  <tr>
                    <th>Sl.No</th>
                    <th>LCR Case No.</th>
                    <th>HC Case No.</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResults.map(({ id, lcrNo, hcCase, date }, index) => (
                    <tr key={id}>
                      <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                      <td>{lcrNo}</td>
                      <td>{hcCase}</td>
                      <td>{date.toLocaleDateString()}</td>
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
