import connectDb from '../lib/Db';
import User from '@/app/models/user.model';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import EditRoleMobile from '../Components/EditRoleMobile';
import Nav from '../Components/Nav';
import UserDashBoard from '../Components/UserDashBoard';
import AdminDashBoard from '../Components/AdminDashBoard';
import DeliveryBoy from '../Components/DeliveryBoy';
import GeoUpdater from '../Components/GeoUpdater';

const Home = async () => {
  await connectDb();
  const session = await getServerSession(authOptions);
  const userDoc = await User.findById((session?.user as any)?.id);
  const user = userDoc
    ? {
        _id: userDoc._id.toString(),
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
        image: userDoc.image,
        mobile: userDoc.mobile,
        createdAt: userDoc.createdAt.toISOString(),
        updatedAt: userDoc.updatedAt.toISOString(),
      }
    : null;
  if (!user) redirect("/Login");
  const inComplete = !user.mobile || !user.role || (!user.mobile && user.role === "user");
  if (inComplete) return <EditRoleMobile />;
  return (
    <div className="min-h-screen">
      <Nav user={user} />
      <GeoUpdater userId={user._id} />
      <div className="flex flex-col items-center justify-start w-full pt-6 px-4 sm:px-6 lg:px-8">
        {user.role === "user" ? (
          <UserDashBoard />
        ) : user.role === "admin" ? (
          <AdminDashBoard />
        ) : (
          <DeliveryBoy />
        )}
      </div>
    </div>
  );
};

export default Home;