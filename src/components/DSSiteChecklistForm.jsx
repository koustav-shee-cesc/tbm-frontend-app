import React, { useState, useEffect } from 'react';

// Reusable Message Box Component
const MessageBox = ({ message, type, onClose, details = '' }) => {
    const bgColor = type === 'success' ? 'bg-blue-600' : 'bg-red-600';
    const hoverColor = type === 'success' ? 'hover:bg-blue-700' : 'hover:bg-red-700';
    const titleColor = type === 'success' ? 'text-blue-600' : 'text-red-600';

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
                <h3 className={`text-xl font-semibold mb-4 ${titleColor}`}>{type === 'success' ? 'Success!' : 'Error!'}</h3>
                <p className="mb-2">{message}</p>
                {details && <p className="text-sm text-gray-600 mb-6">{details}</p>}
                <button
                    onClick={onClose}
                    className={`px-6 py-2 text-white rounded-md transition-colors ${bgColor} ${hoverColor}`}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

const DSSiteChecklistForm = () => {
    const [formData, setFormData] = useState({
        checklistDate: '',
        teamName: '',
        teamMembers: [],
        assetType: '',
        district: '',
        assetName: '', // This will be dynamic
        assetNameNotListed: 'No', // Default to 'No'
        specifyAssetName: '',
        slNo: '',
        photoSlNoPath: '',
        connectionStatus: '',
        testStatus: 'Not Applicable', // Default to 'Not Applicable' as per requirement
        photoNTRPath: '',
        accessToAsset: '',
        properIllumination: '',
        bareLiveComponents: '',
        htLtBoxConfirmed: '',
        htComponents: '',
        abnormalitiesObserved: '',
        othersAbnormalities: '',
        signWritingChecked: [],
        teamMembersWornPPEs: '',
        remarks: ''
    });

    const [companies, setCompanies] = useState([]);
    const [availableMembers, setAvailableMembers] = useState([]);
    const [selectedMemberToAdd, setSelectedMemberToAdd] = useState('');
    const [availableAssetNames, setAvailableAssetNames] = useState([]); // New state for dynamic asset names

    const [showMessageBox, setShowMessageBox] = useState(false);
    const [messageBoxContent, setMessageBoxContent] = useState({ message: '', type: 'success', details: '' });

    // Conditional rendering states
    const [showSpecifyAssetName, setShowSpecifyAssetName] = useState(false);
    const [showSlNo, setShowSlNo] = useState(false);
    const [showConnectedFields, setShowConnectedFields] = useState(false);
    const [showOthersAbnormalities, setShowOthersAbnormalities] = useState(false);
    const [isPreSiteEligible, setIsPreSiteEligible] = useState(false); // NEW: State for pre-site eligibility
    const [preSiteEligibilityMessage, setPreSiteEligibilityMessage] = useState(''); // NEW: Message for eligibility

    // Fetch companies on component mount
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/companies');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setCompanies(data);
            } catch (error) {
                console.error("Failed to fetch companies:", error);
                setMessageBoxContent({
                    message: `Failed to load company names: ${error.message}`,
                    type: 'error',
                    details: 'Please ensure the backend server is running and companies are added.'
                });
                setShowMessageBox(true);
            }
        };
        fetchCompanies();

        // Set today's date as default
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        setFormData(prevData => ({
            ...prevData,
            checklistDate: `${year}-${month}-${day}`
        }));
    }, []);

    // Effect for fetching members based on selected teamName
    useEffect(() => {
        const fetchMembersByCompany = async () => {
            if (formData.teamName) {
                try {
                    const response = await fetch(`http://localhost:3000/api/members?companyName=${encodeURIComponent(formData.teamName)}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    setAvailableMembers(data.map(member => member.memberName));
                    setFormData(prevData => ({ ...prevData, teamMembers: [] }));
                    setSelectedMemberToAdd('');
                } catch (error) {
                    console.error("Failed to fetch members for selected company:", error);
                    setMessageBoxContent({
                        message: `Failed to load members for ${formData.teamName}: ${error.message}`,
                        type: 'error',
                        details: 'Please ensure the backend server is running and members are added for this company.'
                    });
                    setShowMessageBox(true);
                    setAvailableMembers([]);
                }
            } else {
                setAvailableMembers([]);
                setFormData(prevData => ({ ...prevData, teamMembers: [] }));
                setSelectedMemberToAdd('');
            }
        };
        fetchMembersByCompany();
    }, [formData.teamName]);

    // Effect for checking pre-site eligibility (NEW)
    useEffect(() => {
        const checkEligibility = async () => {
            const { checklistDate, teamName, teamMembers } = formData;
            if (checklistDate && teamName && teamMembers.length > 0) {
                try {
                    const queryParams = new URLSearchParams({
                        checklistDate: checklistDate,
                        teamName: teamName,
                        teamMembers: teamMembers.sort().join(',') // Send sorted members for consistent backend check
                    }).toString();
                    const response = await fetch(`http://localhost:3000/api/pre-site-eligibility?${queryParams}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    setIsPreSiteEligible(data.isEligible);
                    if (!data.isEligible) {
                        setPreSiteEligibilityMessage(data.message || 'Pre-Site Checklist not found for this team and date.');
                    } else {
                        setPreSiteEligibilityMessage('Pre-Site Checklist found. You can proceed.');
                    }
                } catch (error) {
                    console.error("Error checking pre-site eligibility:", error);
                    setIsPreSiteEligible(false);
                    setPreSiteEligibilityMessage(`Error checking eligibility: ${error.message}`);
                }
            } else {
                setIsPreSiteEligible(false);
                setPreSiteEligibilityMessage('Please select Date, Team Name, and Team Member(s) to check pre-site eligibility.');
            }
        };
        checkEligibility();
    }, [formData.checklistDate, formData.teamName, formData.teamMembers]); // Re-run when these fields change


    // Fetch asset names based on teamName, assetType, and district
    useEffect(() => {
        const fetchAssetNames = async () => {
            // Only fetch if "Asset Name Not Listed" is "No" and all three criteria are selected
            if (formData.assetNameNotListed === 'No' && formData.teamName && formData.assetType && formData.district) {
                try {
                    const queryParams = new URLSearchParams({
                        companyName: formData.teamName,
                        assetType: formData.assetType,
                        district: formData.district,
                        excludeInspected: 'true'
                    }).toString();
                    const response = await fetch(`http://localhost:3000/api/master-allocations/filtered-asset-names?${queryParams}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    setAvailableAssetNames(data);
                    if (!data.includes(formData.assetName)) {
                        setFormData(prevData => ({ ...prevData, assetName: '' }));
                    }
                } catch (error) {
                    console.error("Failed to fetch filtered asset names:", error);
                    setMessageBoxContent({
                        message: `Failed to load asset names: ${error.message}`,
                        type: 'error',
                        details: 'Please ensure master allocation data is uploaded and matches criteria.'
                    });
                    setShowMessageBox(true);
                    setAvailableAssetNames([]);
                    setFormData(prevData => ({ ...prevData, assetName: '' }));
                }
            } else {
                setAvailableAssetNames([]);
                if (formData.assetNameNotListed === 'No') {
                    setFormData(prevData => ({ ...prevData, assetName: '' }));
                }
            }
        };
        fetchAssetNames();
    }, [formData.teamName, formData.assetType, formData.district, formData.assetNameNotListed]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prevData => {
            let newState = { ...prevData };

            if (type === 'checkbox' && name === 'signWritingChecked') {
                const newSignWritingChecked = checked
                    ? [...prevData.signWritingChecked, value]
                    : prevData.signWritingChecked.filter(item => item !== value);
                newState = { ...newState, signWritingChecked: newSignWritingChecked };
            } else if (type === 'radio' && name === 'assetNameNotListed') {
                setShowSpecifyAssetName(value === 'Yes');
                if (value === 'No') {
                    newState = { ...newState, specifyAssetName: '', slNo: '', photoSlNoPath: '' };
                    setShowSlNo(false);
                } else {
                    const isSlNoRequired = (newState.assetType === 'Consumer Module' || newState.assetType === 'RMU');
                    setShowSlNo(isSlNoRequired);
                    if (!isSlNoRequired) {
                        newState = { ...newState, slNo: '', photoSlNoPath: '' };
                    }
                }
                newState = { ...newState, assetName: '', [name]: value };
            } else if (type === 'radio' && name === 'connectionStatus') {
                setShowConnectedFields(value === 'Connected');
                if (value === 'Disconnected') {
                    newState = {
                        ...newState,
                        accessToAsset: '', properIllumination: '', bareLiveComponents: '',
                        htLtBoxConfirmed: '', htComponents: '', abnormalitiesObserved: '',
                        othersAbnormalities: '', signWritingChecked: [], teamMembersWornPPEs: '',
                        testStatus: 'Not Applicable',
                        photoNTRPath: ''
                    };
                    setShowOthersAbnormalities(false);
                }
                newState = { ...newState, [name]: value };
            } else if (type === 'radio' && name === 'abnormalitiesObserved') {
                setShowOthersAbnormalities(value === 'Others');
                if (value !== 'Others') {
                    newState = { ...newState, othersAbnormalities: '' };
                }
                newState = { ...newState, [name]: value };
            } else if (name === 'assetType') {
                const isSlNoRequired = (value === 'Consumer Module' || value === 'RMU') && newState.assetNameNotListed === 'Yes';
                setShowSlNo(isSlNoRequired);
                if (!isSlNoRequired) {
                    newState = { ...newState, slNo: '', photoSlNoPath: '' };
                }
                newState = { ...newState, [name]: value, assetName: '' };
            } else if (name === 'district') {
                newState = { ...newState, [name]: value, assetName: '' };
            }
            else if (name === 'teamName') {
                newState = {
                    ...newState,
                    [name]: value,
                    assetType: '',
                    district: '',
                    assetName: '',
                    teamMembers: [],
                    specifyAssetName: '',
                    slNo: '',
                    photoSlNoPath: '',
                };
                setShowSpecifyAssetName(false);
                setShowSlNo(false);
            }
            else {
                newState = { ...newState, [name]: value };
            }
            return newState;
        });
    };


    const handleAddMember = () => {
        if (selectedMemberToAdd && !formData.teamMembers.includes(selectedMemberToAdd)) {
            setFormData(prevData => ({
                ...prevData,
                teamMembers: [...prevData.teamMembers, selectedMemberToAdd].sort()
            }));
            setSelectedMemberToAdd('');
        } else if (formData.teamMembers.includes(selectedMemberToAdd)) {
            setMessageBoxContent({
                message: 'This team member has already been added.',
                type: 'error'
            });
            setShowMessageBox(true);
        } else {
            setMessageBoxContent({
                message: 'Please select a team member to add.',
                type: 'error'
            });
            setShowMessageBox(true);
        }
    };

    const handleRemoveMember = (memberToRemove) => {
        setFormData(prevData => ({
            ...prevData,
            teamMembers: prevData.teamMembers.filter(member => member !== memberToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // NEW: Check pre-site eligibility before proceeding with submission
        if (!isPreSiteEligible) {
            setMessageBoxContent({
                message: 'Pre-Site Checklist not completed.',
                type: 'error',
                details: preSiteEligibilityMessage
            });
            setShowMessageBox(true);
            return;
        }

        // Basic validation for teamMembers
        if (formData.teamMembers.length === 0) {
            setMessageBoxContent({
                message: 'Please add at least one team member.',
                type: 'error'
            });
            setShowMessageBox(true);
            return;
        }

        // Conditional validation for assetName
        if (formData.assetNameNotListed === 'No' && !formData.assetName) {
            setMessageBoxContent({
                message: 'Please select an Asset Name from the dropdown.',
                type: 'error'
            });
            setShowMessageBox(true);
            return;
        }
        if (formData.assetNameNotListed === 'Yes' && !formData.specifyAssetName.trim()) {
            setMessageBoxContent({
                message: 'Please specify the asset name as it is not listed.',
                type: 'error'
            });
            setShowMessageBox(true);
            return;
        }

        // Conditional validation for slNo
        if ((formData.assetType === 'Consumer Module' || formData.assetType === 'RMU') && formData.assetNameNotListed === 'Yes' && !formData.slNo.trim()) {
            setMessageBoxContent({
                message: 'SL No is required for Consumer Module/RMU when Asset Name is Not Listed.',
                type: 'error'
            });
            setShowMessageBox(true);
            return;
        }

        // Conditional validation for connected fields
        if (formData.connectionStatus === 'Connected') {
            if (!formData.accessToAsset) {
                setMessageBoxContent({ message: 'Access to Asset is required when Connected.', type: 'error' });
                setShowMessageBox(true); return;
            }
            if (!formData.properIllumination) {
                setMessageBoxContent({ message: 'Proper Illumination is required when Connected.', type: 'error' });
                setShowMessageBox(true); return;
            }
            if (!formData.bareLiveComponents) {
                setMessageBoxContent({ message: 'Bare Live Electrical Components Present Nearby is required when Connected.', type: 'error' });
                setShowMessageBox(true); return;
            }
            if (!formData.htLtBoxConfirmed) {
                setMessageBoxContent({ message: 'HT Box / LT Box of DTR Confirmed is required when Connected.', type: 'error' });
                setShowMessageBox(true); return;
            }
            if (!formData.htComponents) {
                setMessageBoxContent({ message: 'HT Components is required when Connected.', type: 'error' });
                setShowMessageBox(true); return;
            }
            if (!formData.abnormalitiesObserved) {
                setMessageBoxContent({ message: 'Any other abnormalities observed is required when Connected.', type: 'error' });
                setShowMessageBox(true); return;
            }
            if (formData.abnormalitiesObserved === 'Others' && !formData.othersAbnormalities.trim()) {
                setMessageBoxContent({ message: 'Please specify other abnormalities when "Others" is selected.', type: 'error' });
                setShowMessageBox(true); return;
            }
            if (formData.signWritingChecked.length === 0) {
                setMessageBoxContent({ message: 'Sign Writing Checked is required when Connected.', type: 'error' });
                setShowMessageBox(true); return;
            }
            if (!formData.teamMembersWornPPEs) {
                setMessageBoxContent({ message: 'All Team Members have worn PPEs is required when Connected.', type: 'error' });
                setShowMessageBox(true); return;
            }
        }

        // Prepare data for submission
        const dataToSubmit = { ...formData };
        if (formData.assetNameNotListed === 'Yes') {
            dataToSubmit.assetName = formData.specifyAssetName;
        }
        delete dataToSubmit.specifyAssetName;

        dataToSubmit.teamMembers = dataToSubmit.teamMembers.join(',');
        dataToSubmit.signWritingChecked = dataToSubmit.signWritingChecked.join(',');


        try {
            const response = await fetch('http://localhost:3000/api/ds-site-checklist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSubmit),
            });

            const result = await response.json();

            if (response.ok) {
                setMessageBoxContent({
                    message: 'DS Site Checklist submitted successfully and merged into Todays TBM!',
                    type: 'success'
                });
                setShowMessageBox(true);
                // Reset form
                setFormData(prevData => ({
                    checklistDate: new Date().toISOString().split('T')[0],
                    teamName: '',
                    teamMembers: [],
                    assetType: '',
                    district: '',
                    assetName: '',
                    assetNameNotListed: 'No',
                    specifyAssetName: '',
                    slNo: '',
                    photoSlNoPath: '',
                    connectionStatus: '',
                    testStatus: 'Not Applicable',
                    photoNTRPath: '',
                    accessToAsset: '',
                    properIllumination: '',
                    bareLiveComponents: '',
                    htLtBoxConfirmed: '',
                    htComponents: '',
                    abnormalitiesObserved: '',
                    othersAbnormalities: '',
                    signWritingChecked: [],
                    teamMembersWornPPEs: '',
                    remarks: ''
                }));
                setShowSpecifyAssetName(false);
                setShowSlNo(false);
                setShowConnectedFields(false);
                setShowOthersAbnormalities(false);
                setSelectedMemberToAdd('');
                setAvailableMembers([]);
                setAvailableAssetNames([]);
                setIsPreSiteEligible(false); // Reset eligibility
                setPreSiteEligibilityMessage(''); // Clear message

            } else {
                setMessageBoxContent({
                    message: `Error submitting checklist: ${result.message || 'Unknown error'}`,
                    type: 'error',
                    details: JSON.stringify(result.errors || '')
                });
                setShowMessageBox(true);
                console.error('Error:', result);
            }
        } catch (error) {
            console.error('Network error:', error);
            setMessageBoxContent({
                message: 'Network error: Could not connect to the server.',
                type: 'error'
            });
            setShowMessageBox(true);
        }
    };

    return (
        <div className="form-container">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 text-center mb-8 bg-blue-200 p-4 rounded-xl shadow-md">
                DS Site Checklist
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Date Field */}
                <div className="checklist-row">
                    <div>Date:<span className="required-asterisk">*</span></div>
                    <div className="col-span-full sm:col-span-5">
                        <input type="date" id="checklistDate" name="checklistDate"
                               value={formData.checklistDate} onChange={handleChange} required
                               className="block w-full"/>
                    </div>
                </div>

                {/* Team Name Field */}
                <div className="checklist-row">
                    <div>Team Name:<span className="required-asterisk">*</span></div>
                    <div className="col-span-full sm:col-span-5">
                        <select id="teamName" name="teamName"
                                value={formData.teamName} onChange={handleChange} required
                                className="block w-full">
                            <option value="">Select Team</option>
                            {companies.map(company => (
                                <option key={company._id} value={company.companyName}>
                                    {company.companyName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Team Member Field (Custom Multi-select) */}
                <div className="checklist-row">
                    <div>Team Member(s):<span className="required-asterisk">*</span></div>
                    <div className="col-span-full sm:col-span-5">
                        <div className="add-member-section">
                            <select id="teamMemberSelect" className="flex-grow"
                                    value={selectedMemberToAdd}
                                    onChange={(e) => setSelectedMemberToAdd(e.target.value)}
                                    required={formData.teamMembers.length === 0}>
                                <option value="">Select a member to add</option>
                                {availableMembers
                                    .filter(member => !formData.teamMembers.includes(member))
                                    .map(member => (
                                        <option key={member} value={member}>{member}</option>
                                    ))}
                            </select>
                            <button type="button" onClick={handleAddMember}>Add</button>
                        </div>
                        <div id="selectedTeamMembersContainer" className="flex flex-wrap items-center gap-2">
                            {formData.teamMembers.map(member => (
                                <div key={member} className="selected-member-tag">
                                    <span>{member}</span>
                                    <button type="button" className="remove-btn" onClick={() => handleRemoveMember(member)}>&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* NEW: Pre-Site Eligibility Message */}
                {(formData.checklistDate && formData.teamName && formData.teamMembers.length > 0) && (
                    <div className={`p-3 rounded-md text-sm ${isPreSiteEligible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {preSiteEligibilityMessage}
                    </div>
                )}


                {/* Asset Type */}
                <div className="checklist-row">
                    <div>Asset Type:<span className="required-asterisk">*</span></div>
                    <div className="col-span-full sm:col-span-5">
                        <select name="assetType" className="w-full"
                                value={formData.assetType} onChange={handleChange} required>
                            <option value="">Select Asset Type</option>
                            <option value="DTR">DTR</option>
                            <option value="RMU">RMU</option>
                            <option value="Switch Gear">Switch Gear</option>
                            <option value="Consumer Module">Consumer Module</option>
                            <option value="PSS Unit">PSS Unit</option>
                        </select>
                    </div>
                </div>

                {/* District */}
                <div className="checklist-row">
                    <div>District:<span className="required-asterisk">*</span></div>
                    <div className="col-span-full sm:col-span-5">
                        <select name="district" className="w-full"
                                value={formData.district} onChange={handleChange} required>
                            <option value="">Select District</option>
                            <option value="CCD">CCD</option>
                            <option value="CSD">CSD</option>
                            <option value="CND">CND</option>
                            <option value="ND">ND</option>
                            <option value="NSD">NSD</option>
                            <option value="HD">HD</option>
                            <option value="SD">SD</option>
                            <option value="SERD">SERD</option>
                            <option value="SWD">SWD</option>
                            <option value="WSD">WSD</option>
                        </select>
                    </div>
                </div>

                {/* Asset Name Not Listed */}
                <div className="checklist-row">
                    <div>Asset Name Not Listed:<span className="required-asterisk">*</span></div>
                    <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                        <label><input type="radio" name="assetNameNotListed" value="Yes" checked={formData.assetNameNotListed === 'Yes'} onChange={handleChange} required/> Yes</label>
                        <label><input type="radio" name="assetNameNotListed" value="No" checked={formData.assetNameNotListed === 'No'} onChange={handleChange}/> No</label>
                    </div>
                </div>

                {/* Conditional Asset Name Input/Dropdown */}
                <div className="checklist-row">
                    <div>Asset Name:<span className="required-asterisk">*</span></div>
                    <div className="col-span-full sm:col-span-5">
                        {showSpecifyAssetName ? (
                            <input type="text" id="specifyAssetName" name="specifyAssetName" placeholder="Specify Asset Name"
                                   value={formData.specifyAssetName} onChange={handleChange} required
                                   className="block w-full"/>
                        ) : (
                            <select id="assetName" name="assetName"
                                    value={formData.assetName} onChange={handleChange} required
                                    className="block w-full">
                                <option value="">Select Asset Name</option>
                                {availableAssetNames.length > 0 ? (
                                    availableAssetNames.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))
                                ) : (
                                    <option value="" disabled>No Asset Names available for selected criteria</option>
                                )}
                            </select>
                        )}
                    </div>
                </div>

                {/* SL No (Conditionally displayed) */}
                {showSlNo && (
                    <div className="checklist-row" id="slNoSection">
                        <div>SL No:<span className="required-asterisk">*</span></div>
                        <div className="col-span-full sm:col-span-5">
                            <input type="text" id="slNo" name="slNo" placeholder="Enter SL No"
                                   value={formData.slNo} onChange={handleChange} required
                                   className="block w-full"/>
                        </div>
                    </div>
                )}

                {/* Photo of SL No */}
                <div className="checklist-row">
                    <div>Photo of SL No:</div>
                    <div className="col-span-full sm:col-span-5">
                        <input type="file" id="photoSlNoPath" name="photoSlNoPath" onChange={handleChange}
                               className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                    </div>
                </div>

                {/* Connection Status */}
                <div className="checklist-row">
                    <div>Connection Status:<span className="required-asterisk">*</span></div>
                    <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                        <label><input type="radio" name="connectionStatus" value="Connected" checked={formData.connectionStatus === 'Connected'} onChange={handleChange} required/> Connected</label>
                        <label><input type="radio" name="connectionStatus" value="Disconnected" checked={formData.connectionStatus === 'Disconnected'} onChange={handleChange}/> Disconnected</label>
                    </div>
                </div>

                {/* Test Status */}
                <div className="checklist-row">
                    <div>Test Status:<span className="required-asterisk">*</span></div>
                    <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                        <label><input type="radio" name="testStatus" value="NTR" checked={formData.testStatus === 'NTR'} onChange={handleChange} required/> NTR</label>
                        <label><input type="radio" name="testStatus" value="NTR Done" checked={formData.testStatus === 'NTR Done'} onChange={handleChange}/> NTR Done</label>
                        <label><input type="radio" name="testStatus" value="Not Applicable" checked={formData.testStatus === 'Not Applicable'} onChange={handleChange} required/> Not Applicable</label>
                    </div>
                </div>

                {/* Photo of NTR */}
                <div className="checklist-row">
                    <div>Photo of NTR:</div>
                    <div className="col-span-full sm:col-span-5">
                        <input type="file" id="photoNTRPath" name="photoNTRPath" onChange={handleChange}
                               className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                    </div>
                </div>

                {/* Fields for "Connected" status (Conditionally displayed) */}
                {showConnectedFields && (
                    <>
                        {/* Access to Asset */}
                        <div className="checklist-row">
                            <div>Access to Asset:<span className="required-asterisk">*</span></div>
                            <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                                <label><input type="radio" name="accessToAsset" value="Unhindered" checked={formData.accessToAsset === 'Unhindered'} onChange={handleChange} required={showConnectedFields}/> Unhindered</label>
                                <label><input type="radio" name="accessToAsset" value="Blocked" checked={formData.accessToAsset === 'Blocked'} onChange={handleChange}/> Blocked</label>
                            </div>
                        </div>

                        {/* Proper Illumination */}
                        <div className="checklist-row">
                            <div>Proper Illumination:<span className="required-asterisk">*</span></div>
                            <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                                <label><input type="radio" name="properIllumination" value="Adequate" checked={formData.properIllumination === 'Adequate'} onChange={handleChange} required={showConnectedFields}/> Adequate</label>
                                <label><input type="radio" name="properIllumination" value="Not Adequate" checked={formData.properIllumination === 'Not Adequate'} onChange={handleChange}/> Not Adequate</label>
                            </div>
                        </div>

                        {/* Bare Live Electrical Components Present Nearby */}
                        <div className="checklist-row">
                            <div>Bare Live Electrical Components Present Nearby:<span className="required-asterisk">*</span></div>
                            <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                                <label><input type="radio" name="bareLiveComponents" value="Yes" checked={formData.bareLiveComponents === 'Yes'} onChange={handleChange} required={showConnectedFields}/> Yes</label>
                                <label><input type="radio" name="bareLiveComponents" value="No" checked={formData.bareLiveComponents === 'No'} onChange={handleChange}/> No</label>
                            </div>
                        </div>

                        {/* HT Box / LT Box of DTR Confirmed */}
                        <div className="checklist-row">
                            <div>HT Box / LT Box of DTR Confirmed:<span className="required-asterisk">*</span></div>
                            <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                                <label><input type="radio" name="htLtBoxConfirmed" value="Yes" checked={formData.htLtBoxConfirmed === 'Yes'} onChange={handleChange} required={showConnectedFields}/> Yes</label>
                                <label><input type="radio" name="htLtBoxConfirmed" value="No" checked={formData.htLtBoxConfirmed === 'No'} onChange={handleChange}/> No</label>
                                <label><input type="radio" name="htLtBoxConfirmed" value="Not Applicable" checked={formData.htLtBoxConfirmed === 'Not Applicable'} onChange={handleChange}/> Not Applicable</label>
                            </div>
                        </div>

                        {/* HT Components */}
                        <div className="checklist-row">
                            <div>HT Components:<span className="required-asterisk">*</span></div>
                            <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                                <label><input type="radio" name="htComponents" value="Properly Enclosed" checked={formData.htComponents === 'Properly Enclosed'} onChange={handleChange} required={showConnectedFields}/> Properly Enclosed</label>
                                <label><input type="radio" name="htComponents" value="Bare" checked={formData.htComponents === 'Bare'} onChange={handleChange}/> Bare</label>
                            </div>
                        </div>

                        {/* Any other abnormalities observed */}
                        <div className="checklist-row">
                            <div>Any other abnormalities observed:<span className="required-asterisk">*</span></div>
                            <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                                <label><input type="radio" name="abnormalitiesObserved" value="Sound" checked={formData.abnormalitiesObserved === 'Sound'} onChange={handleChange} required={showConnectedFields}/> Sound</label>
                                <label><input type="radio" name="abnormalitiesObserved" value="Smell" checked={formData.abnormalitiesObserved === 'Smell'} onChange={handleChange}/> Smell</label>
                                <label><input type="radio" name="abnormalitiesObserved" value="Others" checked={formData.abnormalitiesObserved === 'Others'} onChange={handleChange}/> Others</label>
                            </div>
                        </div>

                        {/* Others Abnormalities (Conditionally displayed) */}
                        {showOthersAbnormalities && (
                            <div className="checklist-row" id="othersAbnormalitiesSection">
                                <div>Specify Others Abnormalities:<span className="required-asterisk">*</span></div>
                                <div className="col-span-full sm:col-span-5">
                                    <textarea id="othersAbnormalities" name="othersAbnormalities" rows="2" placeholder="Specify other abnormalities"
                                              value={formData.othersAbnormalities} onChange={handleChange} required={showOthersAbnormalities}
                                              className="block w-full"></textarea>
                                </div>
                            </div>
                        )}

                        {/* Sign Writing Checked */}
                        <div className="checklist-row">
                            <div>Sign Writing Checked:<span className="required-asterisk">*</span></div>
                            <div className="col-span-full sm:col-span-5">
                                <div className="options-grid">
                                    <label className="radio-checkbox-group"><input type="checkbox" name="signWritingChecked" value="Transformer Body" checked={formData.signWritingChecked.includes('Transformer Body')} onChange={handleChange} required={showConnectedFields && formData.signWritingChecked.length === 0}/> Transformer Body</label>
                                    <label className="radio-checkbox-group"><input type="checkbox" name="signWritingChecked" value="Cable Boxes" checked={formData.signWritingChecked.includes('Cable Boxes')} onChange={handleChange}/> Cable Boxes</label>
                                    <label className="radio-checkbox-group"><input type="checkbox" name="signWritingChecked" value="FPBs" checked={formData.signWritingChecked.includes('FPBs')} onChange={handleChange}/> FPBs</label>
                                    <label className="radio-checkbox-group"><input type="checkbox" name="signWritingChecked" value="HT Switchgear Side Boxes" checked={formData.signWritingChecked.includes('HT Switchgear Side Boxes')} onChange={handleChange}/> HT Switchgear Side Boxes</label>
                                </div>
                            </div>
                        </div>

                        {/* All Team Members have worn PPEs */}
                        <div className="checklist-row">
                            <div>All Team Members have worn PPEs:<span className="required-asterisk">*</span></div>
                            <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                                <label><input type="radio" name="teamMembersWornPPEs" value="Yes" checked={formData.teamMembersWornPPEs === 'Yes'} onChange={handleChange} required={showConnectedFields}/> Yes</label>
                                <label><input type="radio" name="teamMembersWornPPEs" value="No" checked={formData.teamMembersWornPPEs === 'No'} onChange={handleChange}/> No</label>
                            </div>
                        </div>
                    </>
                )}

                {/* Remarks Field */}
                <div className="checklist-row">
                    <div>Remarks:</div>
                    <div className="col-span-full sm:col-span-5">
                        <textarea id="remarks" name="remarks" rows="4" placeholder="Add any additional remarks here..."
                                  value={formData.remarks} onChange={handleChange}
                                  className="block w-full"></textarea>
                    </div>
                </div>

                <button type="submit" className="submit-button" disabled={!isPreSiteEligible}>Submit Checklist</button>
            </form>

            {showMessageBox && (
                <MessageBox
                    message={messageBoxContent.message}
                    type={messageBoxContent.type}
                    details={messageBoxContent.details}
                    onClose={() => setShowMessageBox(false)}
                />
            )}
        </div>
    );
};

export default DSSiteChecklistForm;
