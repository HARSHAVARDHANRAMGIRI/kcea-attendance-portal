import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
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
  Building
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'KCEA - Kshatriya College of Engineering',
  description: 'Welcome to Kshatriya College of Engineering - Excellence in Engineering Education since 2001',
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="logo-circle">
                <span className="font-serif">KCEA</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">Kshatriya College of Engineering</h1>
                <p className="text-xs text-gray-600">NH-16, 30km from Nizamabad • JNTUH Affiliated • ISO 9001:2008</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="#about" className="nav-link">About</Link>
              <Link href="#academics" className="nav-link">Academics</Link>
              <Link href="#facilities" className="nav-link">Facilities</Link>
              <Link href="#contact" className="nav-link">Contact</Link>
              <Link href="/auth/login" className="btn-kcea">
                Student Portal
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-light">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl font-serif font-bold text-gray-900">
                Welcome to <span className="text-gradient">Kshatriya</span>
              </h1>
              <h2 className="text-2xl text-gray-700">Kshatriya College of Engineering</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Established 2001 • 40 Acres Campus • JNTUH Affiliated • ISO 9001:2008 Certified
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
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
              <div className="flex gap-4">
                <Link href="/auth/login" className="btn-kcea">
                  Access Portal
                </Link>
                <Link href="#about" className="px-6 py-3 border-2 border-kcea-primary text-kcea-primary font-semibold rounded-lg hover:bg-kcea-primary hover:text-white transition-all duration-300">
                  Learn More
                </Link>
              </div>
            </div>
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="KCEA Campus - Kshatriya College of Engineering"
                width={600}
                height={400}
                className="rounded-2xl shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-kcea-primary">2001</div>
              <div className="text-gray-600">Established</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-kcea-primary">40</div>
              <div className="text-gray-600">Acres Campus</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-kcea-primary">1500+</div>
              <div className="text-gray-600">Students Placed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-kcea-primary">150+</div>
              <div className="text-gray-600">Companies Visited</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gradient-light">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">About KCEA</h2>
              <p className="text-lg text-gray-600">Excellence in Engineering Education since 2001</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Kshatriya College of Engineering (KCEA) was established in 2001 under the aegis of 
                Pandit Deendayal Upadyay Educational Society. Located on a sprawling 40 acres campus 
                on the serene NH-16 highway, 30 km from Nizamabad district.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                KCEA is affiliated to Jawaharlal Nehru Technology University Hyderabad (JNTUH) 
                offering graduate programs in engineering and postgraduate programs in Engineering, 
                Business Administration, and Polytechnic.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Digital Learning</h3>
                </div>
                <p className="text-gray-600">Digital Classrooms, NPTEL Course Material, Digital Library & E-Journals</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold">100% Placement Assistance</h3>
                </div>
                <p className="text-gray-600">Training & Placement Cell with 1500+ students placed</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Wifi className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Modern Infrastructure</h3>
                </div>
                <p className="text-gray-600">NME-ICT 10mbps Internet, Spacious Auditorium, Sports & Games</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Campus Life</h3>
                </div>
                <p className="text-gray-600">Separate Hostels, Canteen, NCC/NSS, Professional Chapters</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Highlights */}
      <section id="facilities" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">Campus Highlights</h2>
            <p className="text-lg text-gray-600">Modern facilities and comprehensive support for holistic development</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
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
            ].map((facility, index) => (
              <div key={index} className="bg-gradient-light rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                <div className="text-sm font-medium text-gray-700">{facility}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Departments */}
      <section id="academics" className="py-20 bg-gradient-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">Academic Departments</h2>
            <p className="text-lg text-gray-600">Comprehensive engineering programs with modern curriculum</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'CSE', full: 'Computer Science & Engineering', icon: '💻', students: '500+', labs: '8' },
              { name: 'CSE(DS)', full: 'Computer Science (Data Science)', icon: '📊', students: '200+', labs: '4' },
              { name: 'ECE', full: 'Electronics & Communication', icon: '📡', students: '400+', labs: '6' },
              { name: 'MECH', full: 'Mechanical Engineering', icon: '⚙️', students: '350+', labs: '5' },
              { name: 'CIVIL', full: 'Civil Engineering', icon: '🏗️', students: '300+', labs: '4' },
              { name: 'EEE', full: 'Electrical & Electronics', icon: '⚡', students: '250+', labs: '5' }
            ].map((dept, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-3xl">{dept.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{dept.name}</h3>
                    <p className="text-sm text-gray-600">{dept.full}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-kcea-primary">{dept.students}</div>
                    <div className="text-xs text-gray-600">Students</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-kcea-primary">{dept.labs}</div>
                    <div className="text-xs text-gray-600">Labs</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">Latest News</h2>
            <p className="text-lg text-gray-600">Stay updated with KCEA announcements and events</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-light rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-kcea-primary" />
                <span className="text-sm text-gray-600">1 week ago</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">First Alumni Meet 2K25</h3>
              <p className="text-gray-600 text-sm mb-3">Our First Alumni meet 2K25 was a grand success! Watch the highlights video.</p>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Alumni</span>
            </div>

            <div className="bg-gradient-light rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-kcea-primary" />
                <span className="text-sm text-gray-600">2 weeks ago</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">New CSD Department Approved</h3>
              <p className="text-gray-600 text-sm mb-3">TGCHE has officially allotted COMPUTER SCIENCE & DATA SCIENCE (CSD) with 60 seats intake!</p>
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">Academic</span>
            </div>

            <div className="bg-gradient-light rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-kcea-primary" />
                <span className="text-sm text-gray-600">1 month ago</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Festival Celebrations</h3>
              <p className="text-gray-600 text-sm mb-3">Ugadi Celebrations 2025 and Sankranti Celebration - 2025 held with great enthusiasm.</p>
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Events</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="logo-circle bg-white text-kcea-primary">
                  <span className="font-serif">KCEA</span>
                </div>
                <div>
                  <h3 className="font-bold">KCEA Attendance Portal</h3>
                  <p className="text-sm text-gray-400">kcea.in • Knowledge is Power</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Smart Attendance System<br/>
                <strong>KCEA Technology Portal</strong>
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link href="#about" className="block text-gray-400 hover:text-white transition-colors">About KCEA</Link>
                <Link href="#academics" className="block text-gray-400 hover:text-white transition-colors">Academics</Link>
                <Link href="#facilities" className="block text-gray-400 hover:text-white transition-colors">Facilities</Link>
                <Link href="/auth/login" className="block text-gray-400 hover:text-white transition-colors">Student Portal</Link>
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
}
