import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select/creatable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './FormPage.module.css';
import {
  FaFilePdf,
  FaCheckCircle,
  FaTimesCircle,
  FaPauseCircle
} from 'react-icons/fa';
import Navbar from '../../components/pieces/navbar/Navbar';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

const FormPage = () => {
  const history = useHistory();
  const token = localStorage.getItem('token');

  const [lcrCaseType, setLcrCaseType] = useState(null);
  const [lcrCaseOptions, setLcrCaseOptions] = useState([]);
  const [lcrCaseNo, setLcrCaseNo] = useState('');
  const [lcrYear, setLcrYear] = useState('');

  const [hcCaseType, setHcCaseType] = useState(null);
  const [hcCaseOptions, setHcCaseOptions] = useState([]);
  const [hcCaseNo, setHcCaseNo] = useState('');
  const [hccYear, setHcYear] = useState('');

  const [orderDate, setOrderDate] = useState(null);
  const [nextDateType, setNextDateType] = useState('fixed');
  const [nextDate, setNextDate] = useState(null);
  const [someDateText, setSomeDateText] = useState('');

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfId, setPdfId] = useState(null); // store pdf_id after upload
  const [caseStatus, setCaseStatus] = useState(null);

  const statusOptions = [
    { value: 'disposed', label: 'Disposed', icon: <FaCheckCircle color="#2e7d32" /> },
    { value: 'pending', label: 'Pending', icon: <FaTimesCircle color="#c62828" /> },
    { value: 'stayed', label: 'Stayed', icon: <FaPauseCircle color="#ef6c00" /> }
  ];

  // 🔹 Fetch case types from backend (reusable and returns options)
  const fetchCaseTypes = useCallback(async () => {
    try {
      const [lcrRes, hcRes] = await Promise.all([
        axios.get(`${process.env.BACKEND_BASE_URL}case-types?type=lcr`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.BACKEND_BASE_URL}case-types?type=hcc`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const lcr = (lcrRes?.data?.data || []).map(opt => ({ label: opt.case_name, value: opt.id }));
      const hcc = (hcRes?.data?.data || []).map(opt => ({ label: opt.case_name, value: opt.id }));
      setLcrCaseOptions(lcr);
      setHcCaseOptions(hcc);
      return { lcr, hcc };
    } catch (err) {
      console.error('Error fetching case types:', err);
      return { lcr: [], hcc: [] };
    }
  }, [token]);

  useEffect(() => {
    fetchCaseTypes();
  }, [fetchCaseTypes]);

  // 🔹 Add new LCR type
  const handleLcrTypeCreate = async (inputValue) => {
    try {
      await axios.post(
        `${process.env.BACKEND_BASE_URL}case-types`,
        { case_name: inputValue, type: 'lcr' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh list to reliably get id from backend, then select the created option
      const { lcr } = await fetchCaseTypes();
      const match = lcr.find(opt => (opt.label || '').trim().toLowerCase() === inputValue.trim().toLowerCase());
      if (match) {
        setLcrCaseType(match);
      }
    } catch (err) {
      console.error('Error creating LCR case type:', err);
    }
  };

  // 🔹 Add new HCC type
  const handleHcTypeCreate = async (inputValue) => {
    try {
      await axios.post(
        `${process.env.BACKEND_BASE_URL}case-types`,
        { case_name: inputValue, type: 'hcc' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh list to reliably get id from backend, then select the created option
      const { hcc } = await fetchCaseTypes();
      const match = hcc.find(opt => (opt.label || '').trim().toLowerCase() === inputValue.trim().toLowerCase());
      if (match) {
        setHcCaseType(match);
      }
    } catch (err) {
      console.error('Error creating HCC case type:', err);
    }
  };

  // 🔹 Upload PDF
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    setPdfFile(file);

    if (file) {
      const formData = new FormData();
      formData.append('pdf', file);

      try {
        const res = await axios.post(
          `${process.env.BACKEND_BASE_URL}admin/upload-pdf`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setPdfId(res.data?.data?.pdfId); // Save pdf_id to state
      } catch (err) {
        console.error('PDF upload error:', err.response?.data || err.message);
      }
    }
  };

  // 🔹 Handle form submit with scroll/shake for missing fields
  const handleSubmit = async () => {
    const requiredFields = [
      { id: 'lcrCaseType', value: lcrCaseType },
      { id: 'lcrCaseNo', value: lcrCaseNo },
      { id: 'lcrYear', value: lcrYear },
      { id: 'caseStatus', value: caseStatus },
      { id: 'pdfFile', value: pdfFile },
      { id: 'hcCaseType', value: hcCaseType },
      { id: 'hcCaseNo', value: hcCaseNo },
      { id: 'hcYear', value: hccYear },
      { id: 'nextDateOrText', value: nextDateType === 'fixed' ? nextDate : someDateText }
    ];

    const firstInvalid = requiredFields.find(
      field => !field.value || (typeof field.value === 'string' && field.value.trim() === '')
    );

    if (firstInvalid) {
      const el = document.getElementById(firstInvalid.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          el.classList.add(styles['shake']);
          setTimeout(() => el.classList.remove(styles['shake']), 600);
        }, 400);
      }
      return;
    }

    // ✅ Build payload
    const payload = {
      lcrCaseTypeId: lcrCaseType?.value,
      caseNo: lcrCaseNo,
      lcrYear,
      caseStatus,
      pdf_id: pdfId,
      hccCaseTypeId: hcCaseType?.value,
      highcourtCaseNo: hcCaseNo,
      hccYear,
      orderDate: orderDate ? orderDate.toISOString().split('T')[0] : null,
      next_date: nextDateType === 'fixed' ? (nextDate ? nextDate.toISOString().split('T')[0] : null) : someDateText,
      is_fixed: nextDateType === 'fixed' ? 1 : 0,
    };

    try {
      const res = await axios.post(
        `${process.env.BACKEND_BASE_URL}admin/order-data`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      history.push('/view-report');
    } catch (err) {
      console.error('Form submit error:', err.response?.data || err.message);
    }
  };

  return (
    <div>
      <Navbar />
      <div className={styles['form-page']}>
        <div className={styles['form-sections-wrapper']}>
          {/* Lower Court Record */}
          <div className={`${styles['form-card']} ${styles['half-card']}`}>
            <h2>Lower Court Record</h2>
            <div className={styles['form-group']}>
              <label htmlFor="lcrCaseType">Case Type *</label>
              <div id="lcrCaseType">
                <Select
                  value={lcrCaseType}
                  onChange={setLcrCaseType}
                  onCreateOption={handleLcrTypeCreate}
                  options={lcrCaseOptions}
                  isClearable
                  isSearchable
                  placeholder="Select or type to add"
                />
              </div>
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="lcrCaseNo">Case No. *</label>
              <input id="lcrCaseNo" type="text" value={lcrCaseNo} onChange={(e) => setLcrCaseNo(e.target.value)} placeholder="Enter case number" />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="lcrYear">Year *</label>
              <select id="lcrYear" value={lcrYear} onChange={(e) => setLcrYear(e.target.value)}>
                <option value="">Select Year</option>
                {Array.from({ length: 30 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
            <div className={styles['form-group']}>
              <label>Case Status *</label>
              <div id="caseStatus" className={styles['status-icons']}>
                {statusOptions.map(option => (
                  <div
                    key={option.value}
                    className={`${styles['status-option']} ${caseStatus === option.value ? styles['selected'] : ''}`}
                    onClick={() => setCaseStatus(option.value)}
                  >
                    {option.icon} {option.label}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="pdfFile">Upload PDF *</label>
              <input type="file" id="pdfFile" accept="application/pdf" onChange={handleFileChange} />
              {pdfFile && <div className={styles['pdf-info']}><FaFilePdf /> {pdfFile.name}</div>}
            </div>
          </div>

          {/* High Court Case */}
          <div className={`${styles['form-card']} ${styles['half-card']}`}>
            <h2>High Court Case</h2>
            <div className={styles['form-group']}>
              <label htmlFor="hcCaseType">Case Type *</label>
              <div id="hcCaseType">
                <Select
                  value={hcCaseType}
                  onChange={setHcCaseType}
                  onCreateOption={handleHcTypeCreate}
                  options={hcCaseOptions}
                  isClearable
                  isSearchable
                  placeholder="Select or type to add"
                />
              </div>
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="hcCaseNo">Case No. *</label>
              <input id="hcCaseNo" type="text" value={hcCaseNo} onChange={(e) => setHcCaseNo(e.target.value)} />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="hcYear">Year *</label>
              <select id="hcYear" value={hccYear} onChange={(e) => setHcYear(e.target.value)}>
                <option value="">Select Year</option>
                {Array.from({ length: 30 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className={styles['form-sections-wrapper']}>
          <div className={`${styles['form-card']} ${styles['full-width-card']}`}>
            <h2>Order Details</h2>
            <div className={styles['form-group']}>
              <label>Order Date (optional)</label>
              <DatePicker selected={orderDate} onChange={(date) => setOrderDate(date)} placeholderText="Select date" />
            </div>
            <div className={styles['form-group']}>
              <label>Next *</label>
              <div className={styles['radio-group']}>
                <label>
                  <input type="radio" value="fixed" checked={nextDateType === 'fixed'} onChange={() => setNextDateType('fixed')} />
                  Fixed
                </label>
                <label>
                  <input type="radio" value="someDate" checked={nextDateType === 'someDate'} onChange={() => setNextDateType('someDate')} />
                  Some Date
                </label>
              </div>
              {nextDateType === 'fixed' ? (
                <div id="nextDateOrText">
                  <DatePicker selected={nextDate} onChange={(date) => setNextDate(date)} placeholderText="Select next date" />
                </div>
              ) : (
                <input id="nextDateOrText" type="text" value={someDateText} onChange={(e) => setSomeDateText(e.target.value)} placeholder="Enter custom info" />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem', width: '100%' }}>
            <button onClick={handleSubmit} className={styles['submit-button']}>Submit Report</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPage;
