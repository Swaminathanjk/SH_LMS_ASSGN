
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Student, SubjectData, ChapterProgress, WorkItem, Doubt } from './types';
import { initialStudents, initialSubjects } from './constants';
import StudentCard from './components/StudentCard';
import StudentDrawer from './components/StudentDrawer';
import StudentForm from './components/StudentForm';
import FilterBar from './components/FilterBar';
import SubjectManagerPage from './components/SubjectManagerPage';
import SyllabusProgressPage from './components/SyllabusProgressPage';
import WorkPoolPage from './components/WorkPoolPage';
import DoubtBoxPage from './components/DoubtBoxPage';
import Sidebar from './components/layout/Sidebar';
import { updateDoubtStatusFromWorkItems } from './utils/workPoolService';

type Page = 'students' | 'subjects' | 'syllabus' | 'work-pool' | 'doubts';

const App: React.FC = () => {
    const [students, setStudents] = useState<Student[]>(() => {
        try {
            const localData = localStorage.getItem('sez.students');
            return localData ? JSON.parse(localData) : initialStudents;
        } catch (error) {
            console.error("Error parsing students from localStorage:", error);
            return initialStudents;
        }
    });

    const [allStudentSubjects, setAllStudentSubjects] = useState<{ [key: string]: { studentId: string; subjects: SubjectData[] } }>(() => {
        try {
            const localData = localStorage.getItem('sez.subjects');
            return localData ? JSON.parse(localData) : initialSubjects;
        } catch (error) {
            console.error("Error parsing subjects from localStorage:", error);
            return initialSubjects;
        }
    });

    const [chapterProgress, setChapterProgress] = useState<ChapterProgress[]>(() => {
        try {
            const localData = localStorage.getItem('sez.chapters');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error("Error parsing chapter progress from localStorage:", error);
            return [];
        }
    });

    const [workItems, setWorkItems] = useState<WorkItem[]>(() => {
        try {
            const localData = localStorage.getItem('sez.work');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error("Error parsing work items from localStorage:", error);
            return [];
        }
    });

    const [doubts, setDoubts] = useState<Doubt[]>(() => {
        try {
            const localData = localStorage.getItem('sez.doubts');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error("Error parsing doubts from localStorage:", error);
            return [];
        }
    });

    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
    const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
    const [showArchived, setShowArchived] = useState<boolean>(false);
    const [filters, setFilters] = useState({ board: '', grade: '', batch: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState<Page>('students');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    useEffect(() => {
        localStorage.setItem('sez.students', JSON.stringify(students));
    }, [students]);

    useEffect(() => {
        localStorage.setItem('sez.subjects', JSON.stringify(allStudentSubjects));
    }, [allStudentSubjects]);

    useEffect(() => {
        localStorage.setItem('sez.chapters', JSON.stringify(chapterProgress));
    }, [chapterProgress]);

    useEffect(() => {
        localStorage.setItem('sez.work', JSON.stringify(workItems));
    }, [workItems]);

    useEffect(() => {
        localStorage.setItem('sez.doubts', JSON.stringify(doubts));
    }, [doubts]);
// ➕ In App.tsx, ADD this new useEffect block:
useEffect(() => {
    localStorage.setItem('sez.doubts', JSON.stringify(doubts));
}, [doubts]);

// ✅ THIS IS THE NEW LOGIC TO ADD
useEffect(() => {
    // Only run if there are doubts to check
    if (doubts.length === 0) return;

    let hasChanges = false;
    // Create a new array by checking each doubt against the work items
    const newDoubts = doubts.map(doubt => {
        const updatedDoubt = updateDoubtStatusFromWorkItems(doubt, workItems);
        // If the status has changed, we'll need to save the state
        if (updatedDoubt.status !== doubt.status) {
            hasChanges = true;
        }
        return updatedDoubt;
    });

    // If any doubt was updated, set the new state
    if (hasChanges) {
        setDoubts(newDoubts);
    }
}, [workItems]); // This effect runs ONLY when workItems change
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);


    const handleSaveStudent = useCallback((studentData: Student) => {
        setStudents(prev => {
            const existing = prev.find(s => s.id === studentData.id);
            return existing 
                ? prev.map(s => s.id === studentData.id ? studentData : s) 
                : [...prev, studentData];
        });
        setEditingStudent(null);
        setViewingStudent(studentData);
    }, []);
    
    const handleSaveSubjects = useCallback((studentId: string, subjects: SubjectData[]) => {
        setAllStudentSubjects(prev => ({
            ...prev,
            [studentId]: { studentId, subjects }
        }));
    }, []);

    const handleSaveChapterProgress = useCallback((progress: ChapterProgress) => {
        const oldProgress = chapterProgress.find(p => p.id === progress.id);
        const oldEntries = oldProgress?.entries ?? [];
        const oldEntryIds = new Set(oldEntries.map(e => e.id));
        
        const newEntries = progress.entries;
        const newEntryIds = new Set(newEntries.map(e => e.id));
    
        // --- LOGIC FOR ADDING A WORK ITEM ---
        const addedEntries = newEntries.filter(e => !oldEntryIds.has(e.id));
        const newStartEntry = addedEntries.find(e => e.type === 'start');
    
        if (newStartEntry) {
            const workAlreadyExists = workItems.some(item => 
                item.source === 'syllabus' &&
                item.studentId === progress.studentId &&
                item.subject === progress.subject &&
                item.chapterNo === progress.chapterNo &&
                item.title === `Start reading & note making for ${progress.chapterName}`
            );
    
            if (!workAlreadyExists) {
                const dueDate = new Date(newStartEntry.date);
                dueDate.setDate(dueDate.getDate() + 7);
    
                const newWorkItem: WorkItem = {
                    id: `w_${Date.now()}`,
                    studentId: progress.studentId,
                    title: `Start reading & note making for ${progress.chapterName}`,
                    subject: progress.subject,
                    chapterNo: progress.chapterNo,
                    chapterName: progress.chapterName,
                    topic: '',
                    description: 'Begin reading and making notes as the chapter has started in school.',
                    dueDate: dueDate.toISOString().split('T')[0],
                    status: 'Assign',
                    priority: 'Low',
                    links: [],
                    files: [],
                    mentorNote: '',
                    dateCreated: new Date().toISOString().split('T')[0],
                    source: 'syllabus',
                };
                setWorkItems(prev => [...prev, newWorkItem]);
            }
        }
    
        // --- LOGIC FOR REMOVING A WORK ITEM ---
        const removedEntries = oldEntries.filter(e => !newEntryIds.has(e.id));
        const removedStartEntry = removedEntries.find(e => e.type === 'start');
        
        if (removedStartEntry) {
            setWorkItems(prev => prev.filter(item => 
                !(
                    item.source === 'syllabus' &&
                    item.studentId === progress.studentId &&
                    item.subject === progress.subject &&
                    item.chapterNo === progress.chapterNo &&
                    item.title === `Start reading & note making for ${progress.chapterName}`
                )
            ));
        }

        setChapterProgress(prev => {
            const index = prev.findIndex(p => p.id === progress.id);
            if (index > -1) {
                const newProgressList = [...prev];
                if (progress.entries.length === 0) {
                    newProgressList.splice(index, 1);
                } else {
                    newProgressList[index] = { ...progress };
                }
                return newProgressList;
            } else if (progress.entries.length > 0) {
                return [...prev, progress];
            }
            return prev;
        });
    }, [chapterProgress, workItems]);

    const handleSaveWorkItem = useCallback((workItem: WorkItem) => {
        setWorkItems(prev => {
            const existingIndex = prev.findIndex(item => item.id === workItem.id);
            if (existingIndex > -1) {
                const newItems = [...prev];
                newItems[existingIndex] = workItem;
                return newItems;
            }
            return [...prev, workItem];
        });
    }, []);

    const handleDeleteWorkItem = useCallback((workItemId: string) => {
        setWorkItems(prev => prev.filter(item => item.id !== workItemId));
    }, []);

    const handleSaveDoubt = useCallback((doubt: Doubt) => {
        setDoubts(prev => {
            const existingIndex = prev.findIndex(d => d.id === doubt.id);
            if (existingIndex > -1) {
                const newDoubts = [...prev];
                newDoubts[existingIndex] = doubt;
                return newDoubts;
            }
            return [...prev, doubt];
        });
    }, []);

    const handleDeleteDoubt = useCallback((doubtId: string) => {
        // Find if the doubt being deleted has a linked work task
        const linkedWorkItem = workItems.find(item => item.linkedDoubtId === doubtId && item.source === 'doubt');
        
        // If a task is found, delete it as well.
        if (linkedWorkItem) {
            setWorkItems(prev => prev.filter(item => item.id !== linkedWorkItem.id));
        }
        
        // Then, delete the doubt itself.
        setDoubts(prev => prev.filter(d => d.id !== doubtId));
    }, [workItems]);

    const handleArchive = useCallback((id: string) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, isArchived: !s.isArchived } : s));
        setViewingStudent(null);
    }, []);

    const handleDelete = useCallback((id: string) => {
        setStudents(prev => prev.filter(s => s.id !== id));
        setViewingStudent(null);
    }, []);

    const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({ board: '', grade: '', batch: '' });
        setSearchQuery('');
    }, []);

    const handleCardClick = (student: Student) => {
        setViewingStudent(student);
    };

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            if (student.isArchived !== showArchived) return false;
            if (filters.board && student.board !== filters.board) return false;
            if (filters.grade && student.grade.toString() !== filters.grade) return false;
            if (filters.batch && student.batch !== filters.batch) return false;
            if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [students, showArchived, filters, searchQuery]);

    const renderPageContent = () => {
        switch (currentPage) {
            case 'subjects':
                return (
                    <SubjectManagerPage 
                        students={students}
                        allStudentSubjects={allStudentSubjects}
                        onSaveSubjects={handleSaveSubjects}
                    />
                );
            case 'syllabus':
                 return (
                    <SyllabusProgressPage 
                        students={students}
                        allStudentSubjects={allStudentSubjects}
                        chapterProgress={chapterProgress}
                        onSaveChapterProgress={handleSaveChapterProgress}
                    />
                );
            case 'work-pool':
                return (
                    <WorkPoolPage
                        students={students}
                        allStudentSubjects={allStudentSubjects}
                        workItems={workItems}
                        onSaveWorkItem={handleSaveWorkItem}
                        onDeleteWorkItem={handleDeleteWorkItem}
                    />
                );
            case 'doubts':
                return (
                    <DoubtBoxPage
                        students={students}
                        allStudentSubjects={allStudentSubjects}
                        workItems={workItems}
                        doubts={doubts}
                        onSaveDoubt={handleSaveDoubt}
                        onDeleteDoubt={handleDeleteDoubt}
                        onSaveWorkItem={handleSaveWorkItem}
                    />
                );
            case 'students':
            default:
                return (
                    <>
                        <FilterBar 
                            filters={filters} 
                            onFilterChange={handleFilterChange} 
                            onClearFilters={clearFilters}
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange} 
                        />
                        <div className="flex items-center mb-4 mt-6">
                            <input
                                type="checkbox"
                                id="showArchived"
                                checked={showArchived}
                                onChange={() => setShowArchived(!showArchived)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="showArchived" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                Show Archived Students
                            </label>
                        </div>
                        {filteredStudents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredStudents.map(student => (
                                    <StudentCard key={student.id} student={student} onClick={handleCardClick} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                                <h3 className="text-xl font-semibold">No {showArchived ? 'archived' : 'active'} students found.</h3>
                                <p>Try adjusting your search or filters.</p>
                            </div>
                        )}
                    </>
                );
        }
    }

    const getPageTitle = () => {
        switch (currentPage) {
            case 'subjects': return 'Subject Manager';
            case 'syllabus': return 'Syllabus Progress';
            case 'work-pool': return 'Work Pool';
            case 'doubts': return 'Doubt Box';
            case 'students':
            default: return 'Student Directory';
        }
    }


    return (
        <div className="relative min-h-screen">
            <Sidebar
                isExpanded={isSidebarExpanded}
                onHover={setIsSidebarExpanded}
                currentPage={currentPage}
                onNavigate={setCurrentPage}
            />
             <div 
                className="flex-grow transition-all duration-300"
                style={{ marginLeft: isSidebarExpanded ? '220px' : '60px' }}
            >
                <header className="flex justify-between items-center h-20 px-8">
                    <h1 className="text-2xl font-bold">
                        {getPageTitle()}
                    </h1>
                    <div className="flex items-center space-x-4">
                        {currentPage === 'students' && (
                             <button
                                onClick={() => setEditingStudent({})}
                                className="bg-brand-blue text-white h-10 px-4 rounded-md hover:bg-blue-600 transition-colors text-sm font-semibold"
                            >
                                + Add Student
                            </button>
                        )}
                        <button 
                            onClick={() => setDarkMode(!darkMode)} 
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-lg"
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                    </div>
                </header>
                <main className="p-8 pt-0">
                    {renderPageContent()}
                </main>
            </div>


            {editingStudent && (
                <StudentForm 
                    student={editingStudent}
                    onSave={handleSaveStudent}
                    onCancel={() => setEditingStudent(null)}
                />
            )}

            {viewingStudent && (
                <StudentDrawer
                    student={viewingStudent}
                    onClose={() => setViewingStudent(null)}
                    onEdit={(student) => {
                        setViewingStudent(null);
                        setEditingStudent(student);
                    }}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
};

export default App;
