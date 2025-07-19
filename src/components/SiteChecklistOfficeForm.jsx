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

const SiteChecklistOfficeForm = () => {
    const [formData, setFormData] = useState({
        checklistDate: '',
        teamName: '', // This will be populated from companies
        teamMembers: [],
        typeOfJob: '',
        informedSystemControl: '',
        siteChecklistsTaken: '',
        ppesTaken: [],
        ppesCondition: '',
        toolBagTaken: '',
        toolBagItems: [],
        torchTaken: '',
        properKeysTaken: '',
        firstAidBoxAvailable: '',
        sanitizerMaskAvailable: '',
        teamFit: '',
        remarks: ''
    });

    const [companies, setCompanies] = useState([]); // State to store fetched companies
    const [availableMembers, setAvailableMembers] = useState([]); // State to store members based on selected company
    const [selectedMemberToAdd, setSelectedMemberToAdd] = useState(''); // State for the member select dropdown

    const [showMessageBox, setShowMessageBox] = useState(false);
    const [messageBoxContent, setMessageBoxContent] = useState({ message: '', type: 'success', details: '' });

    // State for conditional rendering of Tool Bag Items
    const [showToolBagItems, setShowToolBagItems] = useState(false);

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

    // Fetch members when teamName (companyName) changes
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
                    setFormData(prevData => ({ ...prevData, teamMembers: [] })); // Clear selected members when company changes
                    setSelectedMemberToAdd(''); // Reset the member selection dropdown
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


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prevData => {
            let newState = { ...prevData };

            if (type === 'checkbox' && name === 'ppesTaken') {
                const newPpesTaken = checked
                    ? [...prevData.ppesTaken, value]
                    : prevData.ppesTaken.filter(item => item !== value);
                newState = { ...newState, ppesTaken: newPpesTaken };
            } else if (type === 'checkbox' && name === 'toolBagItems') {
                const newToolBagItems = checked
                    ? [...prevData.toolBagItems, value]
                    : prevData.toolBagItems.filter(item => item !== value);
                newState = { ...newState, toolBagItems: newToolBagItems };
            } else if (type === 'radio' && name === 'toolBagTaken') {
                setShowToolBagItems(value === 'Yes');
                if (value === 'No') {
                    newState = { ...newState, toolBagItems: [] }; // Clear items if tool bag not taken
                }
                newState = { ...newState, [name]: value };
            } else if (name === 'teamName') {
                // When teamName changes, clear selected members and reset available members
                newState = {
                    ...prevData,
                    [name]: value,
                    teamMembers: [],
                };
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

        // Basic validation for teamMembers
        if (formData.teamMembers.length === 0) {
            setMessageBoxContent({
                message: 'Please add at least one team member.',
                type: 'error'
            });
            setShowMessageBox(true);
            return;
        }

        // Conditional validation for toolBagItems
        if (formData.toolBagTaken === 'Yes' && formData.toolBagItems.length === 0) {
            setMessageBoxContent({
                message: 'Please select at least one item if Tool Bag is taken.',
                type: 'error'
            });
            setShowMessageBox(true);
            return;
        }

        // Prepare data for submission
        const dataToSubmit = { ...formData };
        dataToSubmit.teamMembers = dataToSubmit.teamMembers.join(',');
        dataToSubmit.ppesTaken = dataToSubmit.ppesTaken.join(',');
        dataToSubmit.toolBagItems = dataToSubmit.toolBagItems.join(',');


        try {
            // Changed endpoint to /api/site-checklist-office
            const response = await fetch('http://localhost:3000/api/site-checklist-office', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSubmit),
            });

            const result = await response.json();

            if (response.ok) {
                setMessageBoxContent({
                    message: 'Site Checklist Office submitted successfully!',
                    type: 'success'
                });
                setShowMessageBox(true);
                // Reset form
                setFormData(prevData => ({
                    checklistDate: new Date().toISOString().split('T')[0],
                    teamName: '',
                    teamMembers: [],
                    typeOfJob: '',
                    informedSystemControl: '',
                    siteChecklistsTaken: '',
                    ppesTaken: [],
                    ppesCondition: '',
                    toolBagTaken: '',
                    toolBagItems: [],
                    torchTaken: '',
                    properKeysTaken: '',
                    firstAidBoxAvailable: '',
                    sanitizerMaskAvailable: '',
                    teamFit: '',
                    remarks: ''
                }));
                setShowToolBagItems(false);
                setSelectedMemberToAdd('');
                setAvailableMembers([]); // Clear available members after reset
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
                Points to be checked at office before leaving for Site
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

                {/* Type of Job */}
                <div className="checklist-row">
                    <div>Type of Job<span className="required-asterisk">*</span></div>
                    <div className="col-span-full sm:col-span-5">
                        <select name="typeOfJob" className="w-full"
                                value={formData.typeOfJob} onChange={handleChange} required>
                            <option value="">Select Job Type</option>
                            <option value="SS/RS">SS/RS</option>
                            <option value="D/S">D/S</option>
                            <option value="Re-Measurement">Re-Measurement</option>
                            <option value="PD Resolution">PD Resolution</option>
                            <option value="EHV Consumer">EHV Consumer</option>
                            <option value="Misc">Misc</option>
                        </select>
                    </div>
                </div>

                {/* Informed System Control */}
                <div className="checklist-row">
                    <div>Informed System Control<span className="required-asterisk">*</span></div>
                    <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                        <label><input type="radio" name="informedSystemControl" value="Yes" checked={formData.informedSystemControl === 'Yes'} onChange={handleChange} required/> Yes</label>
                        <label><input type="radio" name="informedSystemControl" value="No" checked={formData.informedSystemControl === 'No'} onChange={handleChange}/> No</label>
                    </div>
                </div>

                {/* Site Inspection Checklists Taken */}
                <div className="checklist-row">
                    <div>Site Inspection Checklists Taken<span className="required-asterisk">*</span></div>
                    <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                        <label><input type="radio" name="siteChecklistsTaken" value="Yes" checked={formData.siteChecklistsTaken === 'Yes'} onChange={handleChange} required/> Yes</label>
                        <label><input type="radio" name="siteChecklistsTaken" value="No" checked={formData.siteChecklistsTaken === 'No'} onChange={handleChange}/> No</label>
                        <label><input type="radio" name="siteChecklistsTaken" value="Not Required" checked={formData.siteChecklistsTaken === 'Not Required'} onChange={handleChange}/> Not Required</label>
                    </div>
                </div>

                {/* Applicable PPEs Taken */}
                <div className="checklist-row">
                    <div>Applicable PPEs Taken<span className="required-asterisk">*</span></div>
                    <div className="col-span-full sm:col-span-5">
                        <div className="flex flex-wrap -mx-2">
                            <div className="w-full sm:w-1/2 px-2">
                                <div className="radio-checkbox-group flex flex-col gap-2">
                                    <label><input type="checkbox" name="ppesTaken" value="Helmet" checked={formData.ppesTaken.includes('Helmet')} onChange={handleChange} required={formData.ppesTaken.length === 0}/> Helmet</label>
                                    <label><input type="checkbox" name="ppesTaken" value="Safety Harness" checked={formData.ppesTaken.includes('Safety Harness')} onChange={handleChange}/> Safety Harness</label>
                                    <label><input type="checkbox" name="ppesTaken" value="Safety Gloves" checked={formData.ppesTaken.includes('Safety Gloves')} onChange={handleChange}/> Safety Gloves</label>
                                </div>
                            </div>
                            <div className="w-full sm:w-1/2 px-2">
                                <div className="radio-checkbox-group flex flex-col gap-2">
                                    <label><input type="checkbox" name="ppesTaken" value="Eye Guard" checked={formData.ppesTaken.includes('Eye Guard')} onChange={handleChange}/> Eye Guard</label>
                                    <label><input type="checkbox" name="ppesTaken" value="Safety Shoe" checked={formData.ppesTaken.includes('Safety Shoe')} onChange={handleChange}/> Safety Shoe</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Condition of PPEs */}
                <div className="checklist-row">
                    <div>Condition of PPEs<span className="required-asterisk">*</span></div>
                    <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                        <label><input type="radio" name="ppesCondition" value="Good" checked={formData.ppesCondition === 'Good'} onChange={handleChange} required/> Good</label>
                        <label><input type="radio" name="ppesCondition" value="Unsatisfactory" checked={formData.ppesCondition === 'Unsatisfactory'} onChange={handleChange}/> Unsatisfactory</label>
                    </div>
                </div>

                {/* Tool Bag Taken */}
                <div className="checklist-row">
                    <div>Tool Bag Taken<span className="required-asterisk">*</span></div>
                    <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                        <label><input type="radio" name="toolBagTaken" value="Yes" checked={formData.toolBagTaken === 'Yes'} onChange={handleChange} required/> Yes</label>
                        <label><input type="radio" name="toolBagTaken" value="No" checked={formData.toolBagTaken === 'No'} onChange={handleChange}/> No</label>
                    </div>
                </div>

                {/* Items in Tool Bag (Conditionally displayed) */}
                {showToolBagItems && (
                    <div className="checklist-row" id="toolBagItemsSection">
                        <div>Items in Tool Bag<span className="required-asterisk">*</span></div>
                        <div className="col-span-full sm:col-span-5">
                            <div className="options-grid tool-bag-items">
                                <label className="radio-checkbox-group"><input type="checkbox" name="toolBagItems" value="Insulated Screw Driver" checked={formData.toolBagItems.includes('Insulated Screw Driver')} onChange={handleChange} required={showToolBagItems && formData.toolBagItems.length === 0}/> Insulated Screw Driver</label>
                                <label className="radio-checkbox-group"><input type="checkbox" name="toolBagItems" value="Slide Range" checked={formData.toolBagItems.includes('Slide Range')} onChange={handleChange}/> Slide Range</label>
                                <label className="radio-checkbox-group"><input type="checkbox" name="toolBagItems" value="Multimeter" checked={formData.toolBagItems.includes('Multimeter')} onChange={handleChange}/> Multimeter</label>
                                <label className="radio-checkbox-group"><input type="checkbox" name="toolBagItems" value="Plier" checked={formData.toolBagItems.includes('Plier')} onChange={handleChange}/> Plier</label>
                                <label className="radio-checkbox-group"><input type="checkbox" name="toolBagItems" value="Torch" checked={formData.toolBagItems.includes('Torch')} onChange={handleChange}/> Torch</label>
                                <label className="radio-checkbox-group"><input type="checkbox" name="toolBagItems" value="Tester" checked={formData.toolBagItems.includes('Tester')} onChange={handleChange}/> Tester</label>
                                <label className="radio-checkbox-group"><input type="checkbox" name="toolBagItems" value="Nose Plus" checked={formData.toolBagItems.includes('Nose Plus')} onChange={handleChange}/> Nose Plus</label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Torch Taken */}
                <div className="checklist-row">
                    <div>Torch Taken:<span className="required-asterisk">*</span></div>
                    <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                        <label><input type="radio" name="torchTaken" value="Yes" checked={formData.torchTaken === 'Yes'} onChange={handleChange} required/> Yes</label>
                        <label><input type="radio" name="torchTaken" value="No" checked={formData.torchTaken === 'No'} onChange={handleChange}/> No</label>
                    </div>
                </div>

                {/* Proper Keys Taken */}
                <div className="checklist-row">
                    <div>Proper Keys Taken:<span className="required-asterisk">*</span></div>
                    <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                        <label><input type="radio" name="properKeysTaken" value="Yes" checked={formData.properKeysTaken === 'Yes'} onChange={handleChange} required/> Yes</label>
                        <label><input type="radio" name="properKeysTaken" value="No" checked={formData.properKeysTaken === 'No'} onChange={handleChange}/> No</label>
                        <label><input type="radio" name="properKeysTaken" value="Not Required" checked={formData.properKeysTaken === 'Not Required'} onChange={handleChange}/> Not Required</label>
                    </div>
                </div>

                {/* First Aid Box Available in Car */}
                <div className="checklist-row">
                    <div>First Aid Box Available in Car:<span className="required-asterisk">*</span></div>
                    <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                        <label><input type="radio" name="firstAidBoxAvailable" value="Yes" checked={formData.firstAidBoxAvailable === 'Yes'} onChange={handleChange} required/> Yes</label>
                        <label><input type="radio" name="firstAidBoxAvailable" value="No" checked={formData.firstAidBoxAvailable === 'No'} onChange={handleChange}/> No</label>
                    </div>
                </div>

                {/* Hand Sanitizer & Mask available with all Team members */}
                <div className="checklist-row">
                    <div>Hand Sanitizer & Mask available with all Team members:<span className="required-asterisk">*</span></div>
                    <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                        <label><input type="radio" name="sanitizerMaskAvailable" value="Yes" checked={formData.sanitizerMaskAvailable === 'Yes'} onChange={handleChange} required/> Yes</label>
                        <label><input type="radio" name="sanitizerMaskAvailable" value="No" checked={formData.sanitizerMaskAvailable === 'No'} onChange={handleChange}/> No</label>
                        <label><input type="radio" name="sanitizerMaskAvailable" value="Not Applicable" checked={formData.sanitizerMaskAvailable === 'Not Applicable'} onChange={handleChange}/> Not Applicable</label>
                    </div>
                </div>

                {/* All Team Members are Physically & Mentally Fit */}
                <div className="checklist-row">
                    <div>All Team Members are Physically & Mentally Fit:<span className="required-asterisk">*</span></div>
                    <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                        <label><input type="radio" name="teamFit" value="Yes" checked={formData.teamFit === 'Yes'} onChange={handleChange} required/> Yes</label>
                        <label><input type="radio" name="teamFit" value="No" checked={formData.teamFit === 'No'} onChange={handleChange}/> No</label>
                    </div>
                </div>

                {/* Remarks Field */}
                <div className="checklist-row">
                    <div>Remarks:</div>
                    <div className="col-span-full sm:col-span-5">
                        <textarea id="remarks" name="remarks" rows="4" placeholder="Add any additional remarks here..."
                                  value={formData.remarks} onChange={handleChange}
                                  className="block w-full"></textarea>
                    </div>
                </div>

                <button type="submit" className="submit-button">Submit Checklist</button>
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

export default SiteChecklistOfficeForm;
