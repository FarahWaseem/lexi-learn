import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth, useSession, useClerk } from "@clerk/clerk-react";
import "./lessonSammary.css";
import HeaderStats from "./HeaderStats";
import LessonRecapCard from "./LessonRecapCard";
import NewVocabs from "./NewVocabs/NewVocabs.jsx";  
import GrammarFeedbackCard from "./GrammarFeedbackCard";
import PositivePointsCard from "./PositivePointsCard/PositivePointsCard.jsx";
import Button from "../../components/reusable/Button/Button.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner.jsx";

export default function LessonSammary() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("id");
  
  // Try to use Clerk auth, but fallback if not available
  let authHook;
  let sessionHook;
  let clerkInstance;
  try {
    authHook = useAuth();
    sessionHook = useSession();
    clerkInstance = useClerk();
  } catch (e) {
    // Clerk not available, use mock auth
    authHook = { getToken: () => null, isLoaded: true, isSignedIn: false };
    sessionHook = { session: null, isLoaded: true };
    clerkInstance = null;
  }
  
  const { getToken, isLoaded, isSignedIn } = authHook;
  const { session } = sessionHook;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    // In development mode without Clerk, fetch without auth
    if (isLoaded) {
      if (isSignedIn || !getToken) {
        console.log('✅ User is signed in, fetching summary...');
        fetchSessionSummary();
      } else {
        setError("Please sign in to view lesson summary");
        setLoading(false);
      }
    }
  }, [sessionId, isLoaded, isSignedIn]);

  const fetchSessionSummary = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Get auth token from Clerk if available
      let token = null;
      try {
        if (session) {
          token = await session.getToken({ skipCache: true });
        } else if (getToken) {
          token = await getToken({ skipCache: true });
        }
      } catch (tokenError) {
        console.warn('⚠️ Could not get token, continuing without auth:', tokenError.message);
      }
      
      console.log('🔑 Token obtained:', token ? `${token.substring(0, 20)}...` : 'none (will try without auth)');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Only add Authorization header if we have a token
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/sessions/${sessionId}/lesson-summary`,
        { headers }
      );

      if (response.status === 401 && retryCount === 0) {
        console.log('🔄 Auth failed, retrying without token (dev mode)...');
        // Try without auth header in development mode
        const retryResponse = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/sessions/${sessionId}/lesson-summary`,
          { 
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
        if (retryResponse.ok) {
          const data = await retryResponse.json();
          console.log('📊 Summary data (dev mode):', data);
          setSummaryData(data);
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch summary: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Summary data:', data);
      
      setSummaryData(data);
    } catch (err) {
      console.error('❌ Error fetching summary:', err);
      setError(err.message || 'Failed to load lesson summary');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Get auth token from Clerk if available
      let token = null;
      if (session) {
        // Use session.getToken() for better token management
        token = await session.getToken({ skipCache: true });
      } else if (getToken) {
        // Fallback to getToken from useAuth
        token = await getToken({ skipCache: true });
      }
      
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/export/sessions/${sessionId}/pdf`,
        { headers }
      );

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Lesson-${sessionId}-Summary.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('❌ Error downloading PDF:', err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleVocabNotebook = () => {
    navigate('/vocab-notebook');
  };

  const handleNextLesson = () => {
    navigate('/lessons');
  };

  if (loading) {
    return (
      <div className="lessonSammary">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('session has expired') || error.includes('expired') || error.includes('sign in');
    
    const handleSignOut = async () => {
      if (clerkInstance) {
        try {
          await clerkInstance.signOut();
          navigate('/sign-in');
        } catch (err) {
          console.error('Sign out error:', err);
          window.location.href = '/sign-in';
        }
      } else {
        window.location.reload();
      }
    };
    
    return (
      <div className="lessonSammary">
        <div className="error-message">
          <h3>⚠️ {isAuthError ? 'Session Expired' : 'Error'}</h3>
          <p>{error}</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {isAuthError ? (
              <>
                <Button variant="primary" onClick={handleSignOut}>
                  Sign In Again
                </Button>
                <Button variant="secondary" onClick={() => navigate('/lessons')}>
                  Back to Lessons
                </Button>
              </>
            ) : (
              <>
                <Button variant="primary" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
                <Button variant="secondary" onClick={() => navigate('/lessons')}>
                  Back to Lessons
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return ( 
    <div className="lessonSammary">
      <Button variant="primary" onClick={handleDownloadPDF} id="btn-done">
        Download as PDF
      </Button>
      
      <div className="lessonSammary__top">
        <HeaderStats summaryData={summaryData} />
      </div>
      
      <div className="dashboard__item reminder">
        <LessonRecapCard summaryData={summaryData} />
      </div>
      
      <div className="dashboard__item reminder">
        <GrammarFeedbackCard summaryData={summaryData} />
        <PositivePointsCard summaryData={summaryData} />
        {/* <NewVocabs summaryData={summaryData} /> */}
      </div>
      
      <div className="filter-footer">
        <Button variant="secondary" onClick={handleVocabNotebook} id="btn-cancel">
          Vocabulary NoteBook
        </Button>
        <Button variant="primary" onClick={handleNextLesson} id="btn-done">
          Next Lesson
        </Button>
      </div>
    </div>
  ); 
}
