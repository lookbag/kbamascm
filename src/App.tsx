import { useEffect, useState } from 'react'
import {
    Package, Truck, Database, LayoutDashboard, Settings,
    LogOut, Bell, FileText, BarChart3, AlertCircle
} from 'lucide-react'
import { useStore } from './store/useStore'
import { VendorPage } from './pages/VendorPage'
import { PartsPage } from './pages/PartsPage'
import './App.css'

function App() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const { loadAll, user } = useStore()

    useEffect(() => {
        loadAll()
    }, [loadAll])

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="fade-in">
                        <div className="page-header">
                            <div className="header-text">
                                <h1>Dashboard</h1>
                                <p>Overview of your supply chain performance and alerts.</p>
                            </div>
                        </div>
                        <div className="stats-grid">
                            <div className="card glass-card">
                                <div className="card-header">
                                    <BarChart3 className="tc" size={20} />
                                    <span>Inventory Value</span>
                                </div>
                                <div className="card-value">$1.2M</div>
                                <div className="card-trend up">+4.5% vs last month</div>
                            </div>
                            <div className="card glass-card">
                                <div className="card-header">
                                    <Truck className="tc" size={20} />
                                    <span>Pending Shipments</span>
                                </div>
                                <div className="card-value">24</div>
                                <div className="card-trend">8 arriving today</div>
                            </div>
                            <div className="card glass-card">
                                <div className="card-header">
                                    <AlertCircle className="tc" size={20} />
                                    <span>Stock Alerts</span>
                                </div>
                                <div className="card-value">3</div>
                                <div className="card-trend down">Action required</div>
                            </div>
                        </div>
                    </div>
                )
            case 'vendors':
                return <VendorPage />
            case 'parts':
                return <PartsPage />
            default:
                return (
                    <div className="empty-state">
                        <div className="empty-icon"><Settings size={48} /></div>
                        <h2>Coming Soon</h2>
                        <p>The {activeTab} module is currently under development.</p>
                    </div>
                )
        }
    }

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="logo">
                    <Package className="logo-icon" size={24} />
                    <span>SCM PRO</span>
                </div>
                <div className="header-actions">
                    <button className="icon-btn"><Bell size={20} /></button>
                    <div className="user-profile">
                        <div className="avatar">AD</div>
                        <div className="user-info">
                            <span className="user-name">{user?.name || 'Admin User'}</span>
                            <span className="user-role">{user?.role || 'Administrator'}</span>
                        </div>
                    </div>
                    <button className="logout-btn"><LogOut size={18} /></button>
                </div>
            </header>

            <div className="app-content">
                <nav className="side-nav">
                    <button
                        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <LayoutDashboard size={18} />
                        <span>Dashboard</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'vendors' ? 'active' : ''}`}
                        onClick={() => setActiveTab('vendors')}
                    >
                        <Truck size={18} />
                        <span>Vendors</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'parts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('parts')}
                    >
                        <Package size={18} />
                        <span>Parts Master</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'bom' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bom')}
                    >
                        <FileText size={18} />
                        <span>BOM</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'mrp' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mrp')}
                    >
                        <BarChart3 size={18} />
                        <span>MRP</span>
                    </button>
                    <div className="nav-spacer"></div>
                    <button
                        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings size={18} />
                        <span>Settings</span>
                    </button>
                </nav>

                <main className="main-viewport">
                    {renderContent()}
                </main>
            </div>
        </div>
    )
}

export default App
