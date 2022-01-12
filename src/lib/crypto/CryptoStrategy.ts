export interface ICryptoStrategy {
   init(): Promise<void>
   verify(data: any): Promise<boolean>
}