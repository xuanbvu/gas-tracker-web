import { getServerSession } from 'next-auth'
import { authOptions } from "./api/auth/[...nextauth]/route"
import { LoginButton } from '../components/auth'
import { convertPrismaStatstoJSStats } from '@/functions/conversions'
import { getRecentStats, getAvgPrice, getCurrQuarterStats, getPrevQuarterStats, getMostRecentStat } from '@/functions/prisma/stats'
import { BsFillArrowUpCircleFill, BsFillArrowDownCircleFill } from 'react-icons/bs'
import { Calendar } from '@/components/calendars'
import { calculateDaysBetween } from '@/functions/helper'
import StatsItem from '@/components/stats'
import StandardizedMileageLineChart from '@/components/charts'
import Link from 'next/link'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) return (
    <LoginButton />
  )

  const userId = session?.user.id || ''
  const recentStats = await getRecentStats(userId, 5)
  
  const currQuarterStats = await getCurrQuarterStats(userId)
  const prevQuarterStats = await getPrevQuarterStats(userId)
  const latestStat = (await getMostRecentStat(userId))[0]

  const avgPricePer = Number((await getAvgPrice(userId))._avg.pricePer)
  const quarterMileage = currQuarterStats.slice(-1)[0].mileage - currQuarterStats[0].mileage
  const comparison = { direction: 'more', percent: 5.6 } // MOCKED DATA
  
  const boxStyle = 'bg-white rounded-lg shadow-lg h-fit'

  return (
    <>
      <div className='grid grid-cols-3 gap-10'>
        {/* mileage graph */}
        <div className={`${boxStyle} px-8 py-5 col-span-2`}>
          <h1>Total mileage this quarter</h1>
          <p className='font-bold text-5xl my-2'>{quarterMileage} mi</p>
          <p className='flex items-center gap-1'>
            {comparison.direction === 'more' ?
              <BsFillArrowUpCircleFill size={24} color="#22D3EE" /> :
              <BsFillArrowDownCircleFill size={24} color="#22D3EE" />
            }
            You've driven {comparison.percent}% {comparison.direction} than last quarter
          </p>
          <StandardizedMileageLineChart
            currStats={currQuarterStats.map((stat) => convertPrismaStatstoJSStats(stat))}
            prevStats={prevQuarterStats.map((stat) => convertPrismaStatstoJSStats(stat))}
          />
        </div>
        {/* calendar */}
        <div className={`${boxStyle} py-5 px-3`}>
          <Calendar startDate={latestStat.createdAt} endDate={new Date()} />
          <p className='text-lg mt-5'>
            It's been <span className='font-bold'>{calculateDaysBetween(latestStat.createdAt, new Date())} days</span> since your last refill.
          </p>
        </div>
        {/* recent refills */}
        <div className='col-span-2'>
          <div className='flex mb-2 justify-between'>
            <h1 className='uppercase font-medium'>Recent Fills</h1>
            <Link href='/add'>
              <button className='uppercase font-bold hover:text-orange-700'>Add +</button>
            </Link>
          </div>
          { recentStats.length > 0 ?
            <div className={`${boxStyle}`}>
              {recentStats.map(item => 
                <StatsItem stat={convertPrismaStatstoJSStats(item)} avgPrice={avgPricePer}/>
              )}
              <Link href='/refills'>
                <button className='border border-black rounded-md px-2 py-1 m-5 bg-gray-300 hover:bg-orange-400 font-medium'>
                  See more refills
                </button>
              </Link>
            </div>
            :
            <p>Looks like you have no records. Add some</p>
          }
        </div>
      </div>
    </>
  )
}
