import React, { useState } from 'react';
import Select from 'react-select/creatable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './FormPage.module.css';
import {
  FaPlus,
  FaFilePdf,
  FaCheckCircle,
  FaTimesCircle,
  FaPauseCircle
} from 'react-icons/fa';
import Navbar from '../../components/pieces/navbar/Navbar';

const FormPage = () => {
  const [lcrCaseType, setLcrCaseType] = useState(null);
  const [lcrCaseOptions, setLcrCaseOptions] = useState([
    { label: 'Civil', value: 'civil' },
    { label: 'Criminal', value: 'criminal' }
  ]);
  const [lcrCaseNo, setLcrCaseNo] = useState('');
  const [lcrYear, setLcrYear] = useState('');

  const [hcCaseType, setHcCaseType] = useState(null);
  const [hcCaseOptions, setHcCaseOptions] = useState([
    { label: 'Appeal', value: 'appeal' },
    { label: 'Revision', value: 'revision' }
  ]);
  const [hcCaseNo, setHcCaseNo] = useState('');
  const [hcYear, setHcYear] = useState('');

  const [orderDate, setOrderDate] = useState(null);
  const [nextDateType, setNextDateType] = useState('fixed');
  const [nextDate, setNextDate] = useState(null);
  const [someDateText, setSomeDateText] = useState('');

  const [pdfFile, setPdfFile] = useState(null);
  const [caseStatus, setCaseStatus] = useState(null);

  const statusOptions = [
    { value: 'disposed', label: 'Disposed', icon: <FaCheckCircle color="#2e7d32" /> },
    { value: 'pending', label: 'Pending', icon: <FaTimesCircle color="#c62828" /> },
    { value: 'stayed', label: 'Stayed', icon: <FaPauseCircle color="#ef6c00" /> }
  ];

  const handleStatusSelect = (statusValue) => {
    setCaseStatus(statusValue);
  };

  const handleLcrTypeCreate = (inputValue) => {
    const newOption = { label: inputValue, value: inputValue.toLowerCase() };
    setLcrCaseOptions([...lcrCaseOptions, newOption]);
    setLcrCaseType(newOption);
  };

  const handleHcTypeCreate = (inputValue) => {
    const newOption = { label: inputValue, value: inputValue.toLowerCase() };
    setHcCaseOptions([...hcCaseOptions, newOption]);
    setHcCaseType(newOption);
  };

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const handleSubmit = () => {
    const requiredFields = [
      { id: 'lcrCaseType', value: lcrCaseType },
      { id: 'lcrCaseNo', value: lcrCaseNo },
      { id: 'lcrYear', value: lcrYear },
      { id: 'caseStatus', value: caseStatus },
      { id: 'pdfFile', value: pdfFile },
      { id: 'hcCaseType', value: hcCaseType },
      { id: 'hcCaseNo', value: hcCaseNo },
      { id: 'hcYear', value: hcYear },
      {
        id: 'nextDateOrText',
        value: nextDateType === 'fixed' ? nextDate : someDateText
      }
    ];

    const firstInvalid = requiredFields.find(
      (field) => !field.value || (typeof field.value === 'string' && field.value.trim() === '')
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
    }
  };

  return (
     <div style={{width: '100vw'}}>
      <Navbar />
      <div className={styles['form-page']}>

        <div className={styles['form-sections-wrapper']}>
          {/* Lower Court Record */}
          <div className={`${styles['form-card']} ${styles['half-card']}`}>
            <h2>Lower Court Record</h2>
            <div className={styles['form-group']}>
              <label htmlFor="lcrCaseType">Case Type <span className={styles['required']}>*</span></label>
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
              <label htmlFor="lcrCaseNo">Case No. <span className={styles['required']}>*</span></label>
              <input
                id="lcrCaseNo"
                type="text"
                value={lcrCaseNo}
                onChange={(e) => setLcrCaseNo(e.target.value)}
                placeholder="Enter case number"
              />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="lcrYear">Year <span className={styles['required']}>*</span></label>
              <select id="lcrYear" value={lcrYear} onChange={(e) => setLcrYear(e.target.value)}>
                <option value="">Select Year</option>
                {Array.from({ length: 30 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>

            <div className={styles['form-group']}>
              <label>Case Status <span className={styles['required']}>*</span></label>
              <div id="caseStatus" className={styles['status-icons']}>
                {statusOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`${styles['status-option']} ${caseStatus === option.value ? styles['selected'] : ''}`}
                    onClick={() => handleStatusSelect(option.value)}
                  >
                    {option.icon} {option.label}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="pdfFile">Upload PDF <span className={styles['required']}>*</span></label>
              <input type="file" id="pdfFile" accept="application/pdf" onChange={handleFileChange} />
              {pdfFile && (
                <div className={styles['pdf-info']}>
                  <FaFilePdf /> {pdfFile.name}
                </div>
              )}
            </div>
          </div>

          {/* High Court Case */}
          <div className={`${styles['form-card']} ${styles['half-card']}`}>
            <h2>High Court Case</h2>
            <div className={styles['form-group']}>
              <label htmlFor="hcCaseType">Case Type <span className={styles['required']}>*</span></label>
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
              <label htmlFor="hcCaseNo">Case No. <span className={styles['required']}>*</span></label>
              <input
                id="hcCaseNo"
                type="text"
                value={hcCaseNo}
                onChange={(e) => setHcCaseNo(e.target.value)}
              />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="hcYear">Year <span className={styles['required']}>*</span></label>
              <select id="hcYear" value={hcYear} onChange={(e) => setHcYear(e.target.value)}>
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
              <DatePicker
                selected={orderDate}
                onChange={(date) => setOrderDate(date)}
                placeholderText="Select date"
              />
            </div>
            <div className={styles['form-group']}>
              <label>Next <span className={styles['required']}>*</span></label>
              <div className={styles['radio-group']}>
                <label>
                  <input
                    type="radio"
                    value="fixed"
                    checked={nextDateType === 'fixed'}
                    onChange={() => setNextDateType('fixed')}
                  />
                  Fixed
                </label>
                <label>
                  <input
                    type="radio"
                    value="someDate"
                    checked={nextDateType === 'someDate'}
                    onChange={() => setNextDateType('someDate')}
                  />
                  Some Date
                </label>
              </div>
              {nextDateType === 'fixed' ? (
                <div id="nextDateOrText">
                  <DatePicker
                    selected={nextDate}
                    onChange={(date) => setNextDate(date)}
                    placeholderText="Select next date"
                  />
                </div>
              ) : (
                <input
                  id="nextDateOrText"
                  type="text"
                  value={someDateText}
                  onChange={(e) => setSomeDateText(e.target.value)}
                  placeholder="Enter custom info"
                />
              )}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem', width: '100%' }}>
            <button onClick={handleSubmit} className={styles['submit-button']}>
              Submit Report
            </button>
          </div>
        </div>

      </div>
     </div>
  );
};

export default FormPage;
