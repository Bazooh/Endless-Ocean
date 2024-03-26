from math import exp

alpha = 1.43
delta = 2744.2


def rho(x):
    return exp(-alpha * x) * (1 - x)


def f(n):
    sum = 0
    for i in range(n):
        sum += rho(i * delta / n)
    return sum * delta / n


def g(n):
    gamma = exp(-alpha * delta / n)
    theta = exp(-alpha * delta)
    delta_n = delta / n
    
    factor = delta_n / (1 - gamma)**2
    
    a = (delta - 1) * theta
    b = - (1 + delta_n) * gamma
    c = (1 - delta + delta_n) * gamma * theta
    
    return factor * (1 + a + b + c)


def h(n):
    gamma = exp(-alpha * delta / n)
    theta = exp(-alpha * delta)
    
    return (delta / n) * ((1 - theta) / (1 - gamma) + (delta*theta*(1-gamma) - delta*gamma*(1-theta)/n) / ((1-gamma)**2))


def l():
    beta = alpha*delta
    theta = exp(-beta)
    
    return (-delta + beta + theta*delta - beta*theta + beta*delta*theta) / (beta*alpha)


n = 100000000

# print(f(n))
print(g(n))
print(h(n))
print(l())