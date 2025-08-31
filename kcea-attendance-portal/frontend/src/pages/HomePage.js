import React from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Award,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Shield,
  Wifi,
  Building,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const HomePage = () => {
  const campusHighlights = [
    'Digital Classrooms',
    'NPTEL Course Material',
    'Digital Library & E-Journals',
    'Professional Chapters',
    '100% Placement Assistance',
    'NME-ICT 10mbps Internet',
    'Separate Hostels',
    'Canteen Facility',
    'Spacious Auditorium',
    'Sports & Games',
    'NCC/NSS Programs',
    'RO Plant for Drinking Water'
  ];

  const departments = [
    { name: 'CSE', full: 'Computer Science & Engineering', icon: '💻', students: '500+', labs: '8' },
    { name: 'CSE(DS)', full: 'Computer Science (Data Science)', icon: '📊', students: '200+', labs: '4' },
    { name: 'ECE', full: 'Electronics & Communication', icon: '📡', students: '400+', labs: '6' },
    { name: 'MECH', full: 'Mechanical Engineering', icon: '⚙️', students: '350+', labs: '5' },
    { name: 'CIVIL', full: 'Civil Engineering', icon: '🏗️', students: '300+', labs: '4' },
    { name: 'EEE', full: 'Electrical & Electronics', icon: '⚡', students: '250+', labs: '5' }
  ];

  const newsItems = [
    {
      title: 'First Alumni Meet 2K25',
      content: 'Our First Alumni meet 2K25 was a grand success! Watch the highlights video.',
      date: '1 week ago',
      priority: 'high',
      badge: 'Alumni'
    },
    {
      title: 'New CSD Department Approved',
      content: 'TGCHE has officially allotted COMPUTER SCIENCE & DATA SCIENCE (CSD) with 60 seats intake!',
      date: '2 weeks ago',
      priority: 'high',
      badge: 'Academic'
    },
    {
      title: 'Festival Celebrations',
      content: 'Ugadi Celebrations 2025 and Sankranti Celebration - 2025 held with great enthusiasm.',
      date: '1 month ago',
      priority: 'medium',
      badge: 'Events'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-railway-blue to-railway-teal text-white py-20">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in-up">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Welcome to <span className="text-railway-teal">Kshatriya</span>
              </h1>
              <h2 className="text-2xl lg:text-3xl font-semibold opacity-90">
                College of Engineering
              </h2>
              <p className="text-xl opacity-80 leading-relaxed">
                Established 2001 • 40 Acres Campus • JNTUH Affiliated • ISO 9001:2008 Certified
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>NH-16, 30km from Nizamabad</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>JNTUH Affiliated</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>ISO 9001:2008</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/register" className="railway-btn railway-btn-large">
                  Student Portal
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link to="/login" className="railway-btn-outline railway-btn-large border-white text-white hover:bg-white hover:text-railway-blue">
                  Login
                </Link>
              </div>
            </div>

            <div className="relative animate-fade-in-up">
              <div className="railway-card bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
                <img
                  src="https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="KCEA Campus - Kshatriya College of Engineering"
                  className="w-full h-64 object-cover rounded-railway"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x400/188CFF/ffffff?text=KCEA+Campus';
                  }}
                />
                <div className="mt-4 text-center">
                  <h3 className="text-lg font-semibold">KCEA Campus</h3>
                  <p className="text-sm opacity-80">40 Acres of Excellence</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="railway-grid">
            <div className="stats-card stats-card-blue text-center">
              <div className="text-4xl font-bold text-railway-blue mb-2">2001</div>
              <div className="text-railway-neutral font-medium">Established</div>
            </div>
            <div className="stats-card stats-card-teal text-center">
              <div className="text-4xl font-bold text-railway-teal mb-2">40</div>
              <div className="text-railway-neutral font-medium">Acres Campus</div>
            </div>
            <div className="stats-card stats-card-success text-center">
              <div className="text-4xl font-bold text-railway-success mb-2">1500+</div>
              <div className="text-railway-neutral font-medium">Students Placed</div>
            </div>
            <div className="stats-card stats-card-warning text-center">
              <div className="text-4xl font-bold text-railway-warning mb-2">150+</div>
              <div className="text-railway-neutral font-medium">Companies Visited</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-railway-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-railway-dark mb-4">About KCEA</h2>
            <p className="text-xl text-railway-neutral">Excellence in Engineering Education since 2001</p>
          </div>
          
          <div className="railway-card mb-12">
            <p className="text-lg text-railway-dark leading-relaxed mb-6">
              Kshatriya College of Engineering (KCEA) was established in 2001 under the aegis of 
              Pandit Deendayal Upadyay Educational Society. Located on a sprawling 40 acres campus 
              on the serene NH-16 highway, 30 km from Nizamabad district.
            </p>
            <p className="text-lg text-railway-dark leading-relaxed">
              KCEA is affiliated to Jawaharlal Nehru Technology University Hyderabad (JNTUH) 
              offering graduate programs in engineering and postgraduate programs in Engineering, 
              Business Administration, and Polytechnic.
            </p>
          </div>

          <div className="railway-grid">
            <div className="railway-card text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-railway-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Digital Learning</h3>
              <p className="text-railway-neutral">Digital Classrooms, NPTEL Course Material, Digital Library & E-Journals</p>
            </div>

            <div className="railway-card text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-railway-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Placement Assistance</h3>
              <p className="text-railway-neutral">Training & Placement Cell with 1500+ students placed</p>
            </div>

            <div className="railway-card text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Modern Infrastructure</h3>
              <p className="text-railway-neutral">NME-ICT 10mbps Internet, Spacious Auditorium, Sports & Games</p>
            </div>

            <div className="railway-card text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Campus Life</h3>
              <p className="text-railway-neutral">Separate Hostels, Canteen, NCC/NSS, Professional Chapters</p>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Highlights */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-railway-dark mb-4">Campus Highlights</h2>
            <p className="text-xl text-railway-neutral">Modern facilities and comprehensive support for holistic development</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {campusHighlights.map((facility, index) => (
              <div key={index} className="railway-card-compact text-center hover:shadow-railway transition-shadow duration-200">
                <CheckCircle className="w-6 h-6 text-railway-success mx-auto mb-2" />
                <div className="text-sm font-medium text-railway-dark">{facility}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Departments */}
      <section className="py-20 bg-railway-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-railway-dark mb-4">Academic Departments</h2>
            <p className="text-xl text-railway-neutral">Comprehensive engineering programs with modern curriculum</p>
          </div>

          <div className="railway-grid">
            {departments.map((dept, index) => (
              <div key={index} className="railway-card hover:shadow-railway-lg transition-shadow duration-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">{dept.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-railway-dark">{dept.name}</h3>
                    <p className="text-sm text-railway-neutral">{dept.full}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-railway-blue">{dept.students}</div>
                    <div className="text-xs text-railway-neutral">Students</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-railway-teal">{dept.labs}</div>
                    <div className="text-xs text-railway-neutral">Labs</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-railway-dark mb-4">Latest News</h2>
            <p className="text-xl text-railway-neutral">Stay updated with KCEA announcements and events</p>
          </div>

          <div className="railway-grid">
            {newsItems.map((news, index) => (
              <div key={index} className="news-card">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-railway-blue" />
                  <span className="text-sm text-railway-neutral">{news.date}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-railway-dark">{news.title}</h3>
                <p className="text-railway-neutral text-sm mb-3 line-clamp-2">{news.content}</p>
                <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                  news.badge === 'Alumni' ? 'bg-blue-100 text-blue-800' :
                  news.badge === 'Academic' ? 'bg-green-100 text-green-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {news.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-railway text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-4">Ready to Join KCEA?</h2>
          <p className="text-xl mb-8 opacity-90">
            Access your student portal and start tracking your attendance today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="railway-btn bg-white text-railway-blue hover:bg-railway-gray railway-btn-large">
              Register Now
            </Link>
            <Link to="/login" className="railway-btn-outline border-white text-white hover:bg-white hover:text-railway-blue railway-btn-large">
              Student Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-railway-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="kcea-logo mb-4">
                <div className="kcea-logo-circle">
                  <span className="font-serif">KCEA</span>
                </div>
                <div>
                  <div className="text-white font-bold">KCEA Portal</div>
                  <div className="text-gray-400 text-sm">Smart Attendance System</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Kshatriya College of Engineering<br/>
                Excellence in Education since 2001
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link to="/" className="block text-gray-400 hover:text-white transition-colors">Home</Link>
                <Link to="/login" className="block text-gray-400 hover:text-white transition-colors">Student Login</Link>
                <Link to="/register" className="block text-gray-400 hover:text-white transition-colors">Register</Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>NH-16, 30km from Nizamabad</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+91 XXXX XXXXXX</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>info@kcea.edu</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Kshatriya College of Engineering. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
