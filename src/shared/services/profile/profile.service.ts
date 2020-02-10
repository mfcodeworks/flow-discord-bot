import { Injectable, HttpService } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { Profile } from '../../core/profile';
import { Redis } from 'ioredis';
import config from 'config';
import { Balance, BalanceAmount } from 'src/discord/core/balance';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable()
export class ProfileService {
    private client: Redis;

    constructor(
        private _redis: RedisService,
        private http: HttpService
    ) {
        this.client = _redis.getClient();
    }

    // Save user
    public save(profile: Profile): Promise<string> {
        return this.client.set(`user:${profile.id}`, JSON.stringify(profile))
    }

    // Get user
    public async get(id: string): Promise<Profile> {
        return new Profile(
            Object.assign(
                JSON.parse(await this.client.get(`user:${id}`)) || {}, { id }
            )
        )
    }

    public sources(user: Profile): Observable<any[]> {
        return this.http.get(
            `${config.get<Balance>('wallet.api')}/me/payment/source`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            }
        ).pipe(
            map(d => d.data),
            tap(s => console.log('Retrieved sources:', s))
        );
    }

    public balance(user: Profile): Observable<BalanceAmount> {
        return this.http.get(
            `${config.get<Balance>('wallet.api')}/me/balance`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            }
        ).pipe(
            map(d => d.data),
            map((balances: Balance) => balances.available.find(b => b.currency == user.currency)),
            tap(b => console.log('Retrieved balance:', b))
        );
    }
}
